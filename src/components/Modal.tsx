import type React from 'react';

export const Modal: React.FC<React.PropsWithChildren<{ title: string; modalId: string }>> = ({
  title,
  modalId,
  children,
}) => {
  return (
    <>
      <input type="checkbox" id={modalId} className="modal-toggle" />
      <div className="modal">
        <div className="modal-box relative w-3/4 max-w-3xl">
          <label htmlFor={modalId} className="btn btn-sm btn-circle absolute right-3 top-3">
            ✕
          </label>
          <h3 className="text-3xl font-semibold">{title}</h3>
          <main className="py-4 flex flex-col justify-center items-center">{children}</main>
        </div>
      </div>
    </>
  );
};

export const OpenModalButton: React.FC<React.PropsWithChildren<{ modalId: string }>> = ({
  modalId,
  children,
}) => {
  return (
    <label
      role={'button'}
      className="fixed bottom-16 right-16 btn btn-circle modal-button"
      htmlFor={modalId}
    >
      {children}
    </label>
  );
};
