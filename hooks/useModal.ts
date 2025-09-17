import { useState, useCallback } from 'react';
import type { ModalType, ModalPropsMap } from '../types';

export const useModal = () => {
  const [modal, setModal] = useState<{ type: ModalType | null, props: any }>({ type: null, props: {} });

  const openModal = useCallback(<T extends ModalType>(type: T, props: ModalPropsMap[T]) => {
    setModal({ type, props });
  }, []);

  const closeModal = useCallback(() => {
    setModal({ type: null, props: {} });
  }, []);

  return {
    modal,
    openModal,
    closeModal,
  };
};