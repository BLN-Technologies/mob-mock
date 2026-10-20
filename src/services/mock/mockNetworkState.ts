/**
 * Cargo Mobile V1 - Simulated Network Connectivity State
 * Isolated to prevent circular require cycles between sync services and mock state.
 */

let isSimulatedOffline = false;

export const mockNetworkState = {
  isOffline: (): boolean => isSimulatedOffline,
  setOffline: (offline: boolean): void => {
    isSimulatedOffline = offline;
  },
};
