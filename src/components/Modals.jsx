import React, { useState, useEffect, useRef, useCallback } from "react";
import { styles } from "../styles.js";

/* ---------- MODALES PROPIOS (reemplazan window.confirm / window.prompt) ---------- */
// Contexto para que las vistas del Gran Libro (Clases, Bestiario, Objetos,
// Personajes, Capítulos, Estados alterados, Sets) y la barra lateral pidan
// confirmación o texto sin usar window.confirm/window.prompt (rompen la
// estética y no se pueden personalizar). WorldBuilder es el único Provider;
// el resto consume por contexto en vez de recibir las funciones como props
// a través de vistas intermedias que no las necesitan.
export const ModalContext = React.createContext(null);

export function useModals() {
  const ctx = React.useContext(ModalContext);
  if (!ctx) throw new Error("useModals() se usó fuera de <ModalContext.Provider>");
  return ctx;
}

// Hook de estado: guarda a lo sumo un confirm y un prompt pendientes a la
// vez, y devuelve funciones que se comportan como sus equivalentes nativos
// pero devuelven una Promise — así cada call site solo agrega un "await".
export function useAppModals() {
  const [confirmState, setConfirmState] = useState(null);
  const [promptState, setPromptState] = useState(null);

  const confirmAction = useCallback((message, opts = {}) => {
    return new Promise((resolve) => {
      setConfirmState({ message, danger: !!opts.danger, confirmLabel: opts.confirmLabel, resolve });
    });
  }, []);
  const promptValue = useCallback((title, opts = {}) => {
    return new Promise((resolve) => {
      setPromptState({ title, initialValue: opts.initialValue || "", placeholder: opts.placeholder, confirmLabel: opts.confirmLabel, resolve });
    });
  }, []);

  const modalElement = (
    <>
      {confirmState && (
        <ConfirmModal
          message={confirmState.message} danger={confirmState.danger} confirmLabel={confirmState.confirmLabel}
          onConfirm={() => { const resolve = confirmState.resolve; setConfirmState(null); resolve(true); }}
          onCancel={() => { const resolve = confirmState.resolve; setConfirmState(null); resolve(false); }}
        />
      )}
      {promptState && (
        <PromptModal
          title={promptState.title} initialValue={promptState.initialValue} placeholder={promptState.placeholder} confirmLabel={promptState.confirmLabel}
          onConfirm={(v) => { const resolve = promptState.resolve; setPromptState(null); resolve(v); }}
          onCancel={() => { const resolve = promptState.resolve; setPromptState(null); resolve(null); }}
        />
      )}
    </>
  );

  return { confirmAction, promptValue, modalElement };
}

// Modal "confirmar" (reemplazo de window.confirm). Clic afuera o Escape
// cancela; Enter confirma. `danger` pinta el botón principal en rojo (para
// borrados irreversibles) en vez del acento cian habitual.
export function ConfirmModal({ message, danger, confirmLabel, onConfirm, onCancel }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onCancel();
      else if (e.key === "Enter") onConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onConfirm, onCancel]);
  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modalPanel} onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <p style={styles.modalMessage}>{message}</p>
        <div style={styles.modalActions}>
          <button style={styles.modalBtnCancel} onClick={onCancel}>Cancelar</button>
          <button style={danger ? styles.modalBtnDanger : styles.modalBtnPrimary} onClick={onConfirm}>
            {confirmLabel || (danger ? "Eliminar" : "Confirmar")}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal "pedir texto" (reemplazo de window.prompt), usado para nombrar
// clases/habilidades/personajes/objetos/etc. nuevos. Enter confirma (si no
// está vacío), Escape o clic afuera cancela.
export function PromptModal({ title, initialValue, placeholder, confirmLabel, onConfirm, onCancel }) {
  const [value, setValue] = useState(initialValue || "");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  }
  function onKeyDown(e) {
    if (e.key === "Escape") onCancel();
    else if (e.key === "Enter") submit();
  }
  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modalPanel} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <p style={styles.modalTitle}>{title}</p>
        <input ref={inputRef} type="text" value={value} onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown} placeholder={placeholder} style={styles.modalInput} />
        <div style={styles.modalActions}>
          <button style={styles.modalBtnCancel} onClick={onCancel}>Cancelar</button>
          <button style={styles.modalBtnPrimary} onClick={submit} disabled={!value.trim()}>
            {confirmLabel || "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}
