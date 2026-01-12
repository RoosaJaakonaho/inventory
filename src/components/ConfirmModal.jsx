import styles from './Modal.module.css'

export default function ConfirmModal({ title, message, confirmText, confirmStyle = 'danger', onConfirm, onCancel, children }) {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
        </div>

        <div className={styles.form}>
          {message && <p className={styles.message}>{message}</p>}
          {children}

          <div className={styles.actions}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Peruuta
            </button>
            <button
              type="button"
              className={`btn btn-${confirmStyle}`}
              onClick={onConfirm}
            >
              {confirmText || 'Vahvista'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
