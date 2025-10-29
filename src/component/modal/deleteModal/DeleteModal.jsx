import React from "react";
import styles from "../deleteModal/DeleteModal.module.css";

const DeleteModal = ({ isOpen, title, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>
          <span className={styles.icon}>🛑</span>
          {title}
        </h3>
        <div className={styles.buttonWrapper}>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            {confirmText}
          </button>
          <button className={styles.cancelBtn} onClick={onCancel}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
