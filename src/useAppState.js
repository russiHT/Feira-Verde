import { useState, useEffect } from 'react';
import { appState } from './estado';

/**
 * Ponte entre a store e o React.
 *
 * Fica separado de `estado.js` de propósito: a camada de domínio não deve
 * depender de framework nenhum. É o que permite testá-la em Node puro e o
 * que vai permitir movê-la para o servidor sem reescrever as regras.
 */
export function useAppState() {
  const [banco, setBanco] = useState(appState.banco);

  useEffect(() => {
    setBanco({ ...appState.banco });
    return appState.inscrever((novo) => setBanco({ ...novo }));
  }, []);

  return banco;
}
