export function finalizedExecutionError(result?: string) {
  return result === "FINISHED_WITH_ERROR" ? `Finalized without successful return (${result}).` : "";
}

export function agreedExecution(validators: Array<{ vote?: string; execution_result?: string }> = []) {
  const agreed = validators.filter((validator) => validator.vote === "agree").map((validator) => validator.execution_result);
  if (agreed.includes("SUCCESS")) return "SUCCESS";
  if (agreed.includes("ERROR")) return "ERROR";
  return "UNKNOWN";
}
