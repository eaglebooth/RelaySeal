export function finalizedExecutionError(result?: string) {
  return result === "FINISHED_WITH_ERROR" ? `Finalized without successful return (${result}).` : "";
}
