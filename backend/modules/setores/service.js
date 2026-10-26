import { setoresRepository } from './repository.js';

export const setoresService = {
  async listar() {
    return setoresRepository.listar();
  },
  async buscarPorId(id) {
    return setoresRepository.buscarPorId(id);
  }
};
