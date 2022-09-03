import type React from 'react';
import { HTMLAttributes } from 'react';

export const Modal: React.FC<React.PropsWithChildren<{ title: string; modalId: string }>> = ({
  title,
  modalId,
  children,
}) => {
  return (
    <>
      <input type="checkbox" id={modalId} className="modal-toggle" />
      <label htmlFor={modalId} className="modal">
        <label htmlFor="" className="modal-box relative w-3/4 max-w-3xl custom-scrollbar">
          <label htmlFor={modalId} className="btn btn-sm btn-circle absolute right-3 top-3">
            ✕
          </label>
          <h3 className="text-3xl font-semibold pr-5">{title}</h3>
          <main className="py-4 flex flex-col justify-center items-center">{children}</main>
        </label>
      </label>
    </>
  );
};

export const OpenModalButton: React.FC<
  React.PropsWithChildren<{ modalId: string; extraClasses?: string }> &
    HTMLAttributes<HTMLLabelElement>
> = ({ modalId, extraClasses = '', children, ...remaining }) => {
  return (
    <label
      role={'button'}
      className={` btn modal-button ${extraClasses}`}
      htmlFor={modalId}
      {...remaining}
    >
      {children}
    </label>
  );
};
