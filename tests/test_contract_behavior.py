import json
import hashlib


def addr(value):
    return "0x" + bytes(value).hex()


def register(contract, operator):
    contract.register_service("payments-api", addr(operator), "eaglebooth/relayseal")


def test_deploys_and_reports_v2(direct_deploy):
    contract = direct_deploy("contracts/relayseal.py")
    assert json.loads(contract.get_contract_version()) == {
        "name": "RelaySeal",
        "schema": "authority-bound-handover-v2",
        "version": 2,
    }


def test_rejects_malformed_inputs_with_distinct_errors(direct_deploy, direct_vm, direct_alice):
    contract = direct_deploy("contracts/relayseal.py")
    with direct_vm.expect_revert("INVALID_SERVICE_ID"):
        contract.register_service("bad service", addr(direct_alice), "eaglebooth/relayseal")
    with direct_vm.expect_revert("INVALID_OPERATOR_ADDRESS"):
        contract.register_service("payments-api", "0x1234", "eaglebooth/relayseal")
    with direct_vm.expect_revert("INVALID_REPOSITORY"):
        contract.register_service("payments-api", addr(direct_alice), "github.com/eaglebooth/relayseal")


def test_controller_namespaces_prevent_cross_service_collisions(direct_deploy, direct_vm, direct_owner, direct_alice, direct_bob):
    contract = direct_deploy("contracts/relayseal.py")
    register(contract, direct_alice)
    with direct_vm.prank(direct_bob):
        contract.register_service("payments-api", addr(direct_alice), "other/control-plane")
    owner_record = json.loads(contract.get_service(addr(direct_owner), "payments-api"))
    bob_record = json.loads(contract.get_service(addr(direct_bob), "payments-api"))
    assert owner_record["repository"] == "eaglebooth/relayseal"
    assert bob_record["repository"] == "other/control-plane"


def test_policy_requires_independent_repository_and_both_parties(direct_deploy, direct_vm, direct_owner, direct_alice, direct_bob):
    contract = direct_deploy("contracts/relayseal.py")
    register(contract, direct_alice)
    rules = "Require deployment, incidents, risks, rollback, actions, owners, deadlines and acknowledgement."
    with direct_vm.expect_revert("CORROBORATION_REPOSITORY_NOT_INDEPENDENT"):
        contract.create_policy(addr(direct_owner), "payments-api", "policy-001", addr(direct_bob), "eaglebooth/relayseal", 1, rules)
    digest = contract.create_policy(addr(direct_owner), "payments-api", "policy-001", addr(direct_bob), "independent/audit", 1, rules)
    with direct_vm.prank(direct_alice):
        assert contract.approve_policy(addr(direct_owner), "payments-api", "policy-001", digest) == "PARTIALLY_APPROVED"
    with direct_vm.prank(direct_bob):
        assert contract.approve_policy(addr(direct_owner), "payments-api", "policy-001", digest) == "SEALED"
    assert json.loads(contract.get_policy(addr(direct_owner), "payments-api", "policy-001"))["sealed"] is True


def test_guarded_operation_enforces_sender_and_replay_guards(direct_deploy, direct_vm, direct_owner, direct_alice, direct_bob):
    contract = direct_deploy("contracts/relayseal.py")
    register(contract, direct_alice)
    payload = "a" * 64
    with direct_vm.prank(direct_bob), direct_vm.expect_revert("ACTIVE_OPERATOR_ONLY"):
        contract.perform_guarded_operation(addr(direct_owner), "payments-api", "deploy-001", payload)
    with direct_vm.prank(direct_alice):
        receipt = contract.perform_guarded_operation(addr(direct_owner), "payments-api", "deploy-001", payload)
        with direct_vm.expect_revert("OPERATION_ID_REPLAY"):
            contract.perform_guarded_operation(addr(direct_owner), "payments-api", "deploy-001", "b" * 64)
        with direct_vm.expect_revert("PAYLOAD_REPLAY"):
            contract.perform_guarded_operation(addr(direct_owner), "payments-api", "deploy-002", payload)
    assert json.loads(contract.get_operation_receipt(addr(direct_owner), "payments-api", "deploy-001"))["receipt"] == receipt


def test_full_two_source_handover_lifecycle(direct_deploy, direct_vm, direct_owner, direct_alice, direct_bob):
    contract = direct_deploy("contracts/relayseal.py")
    register(contract, direct_alice)
    rules = "Require deployment, incidents, risks, rollback, actions, owners, deadlines and acknowledgement."
    policy_digest = contract.create_policy(addr(direct_owner), "payments-api", "policy-001", addr(direct_bob), "independent/audit", 1, rules)
    with direct_vm.prank(direct_alice):
        contract.approve_policy(addr(direct_owner), "payments-api", "policy-001", policy_digest)
    with direct_vm.prank(direct_bob):
        contract.approve_policy(addr(direct_owner), "payments-api", "policy-001", policy_digest)

    outgoing = "# Handover\nDeployment healthy. Incidents none. Risks documented. Rollback tested. Actions, owners and deadlines acknowledged."
    corroboration = "# Independent audit\nDeployment healthy. No incidents found. Risks and rollback verified. Actions, owners and deadlines corroborated."
    commit = "1" * 40
    outgoing_url = f"https://raw.githubusercontent.com/eaglebooth/relayseal/{commit}/handover.md"
    corroboration_url = f"https://raw.githubusercontent.com/independent/audit/{commit}/audit.md"
    with direct_vm.prank(direct_alice):
        contract.submit_handover(addr(direct_owner), "payments-api", "policy-001", "handover-001", outgoing_url, hashlib.sha256(outgoing.encode()).hexdigest(), len(outgoing.encode()), "outgoing-001")
    with direct_vm.prank(direct_bob):
        digest = contract.submit_corroboration(addr(direct_owner), "payments-api", "policy-001", "handover-001", corroboration_url, hashlib.sha256(corroboration.encode()).hexdigest(), len(corroboration.encode()), "corroboration-001")

    direct_vm.mock_web(r"eaglebooth/relayseal", {"method": "GET", "status": 200, "body": outgoing})
    direct_vm.mock_web(r"independent/audit", {"method": "GET", "status": 200, "body": corroboration})
    direct_vm.mock_llm(r"Assess two independently", '{"verdict":"READY"}')
    assert contract.assess_handover(addr(direct_owner), "payments-api", "policy-001", "handover-001") == "READY"
    with direct_vm.prank(direct_bob):
        assert contract.accept_handover(addr(direct_owner), "payments-api", "policy-001", "handover-001", digest) == "ACCEPTED"
    assert contract.activate_handover(addr(direct_owner), "payments-api", "policy-001", "handover-001") == "ACTIVATED"
    assert json.loads(contract.get_service(addr(direct_owner), "payments-api"))["active_operator"] == addr(direct_bob)
