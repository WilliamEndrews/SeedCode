// =============================================================================
// Eventos do builder (comunicação leve entre painéis no cliente)
// -----------------------------------------------------------------------------
// Usamos CustomEvents no window para desacoplar os painéis (editor, chat,
// preview). Quando os arquivos de um projeto mudam, quem alterou dispara
// `emitFilesChanged(projectId)` e o PreviewPane recarrega automaticamente.
// =============================================================================

export const FILES_CHANGED_EVENT = "seedcode:files-changed";

// Dispara o evento de mudança de arquivos para um projeto específico.
export function emitFilesChanged(projectId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(FILES_CHANGED_EVENT, { detail: { projectId } }),
  );
}
