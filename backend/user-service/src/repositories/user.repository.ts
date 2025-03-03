import { User, IUser } from '../models/user.model';

export class UserRepository {
  /**
   * Busca un usuario por su userId.
   * @param userId ID del usuario.
   */
  async findByUserId(userId: string): Promise<IUser | null> {
    try {
      return await User.findOne({ userId });
    } catch (error) {
      console.error('Error en UserRepository.findByUserId:', error);
      throw error;
    }
  }

  /**
   * Actualiza el plan del usuario.
   * @param userId ID del usuario.
   * @param plan Nuevo plan (por ejemplo, 'premium').
   */
  async updatePlan(userId: string, plan: string): Promise<IUser | null> {
    try {
      return await User.findOneAndUpdate({ userId }, { plan }, { new: true });
    } catch (error) {
      console.error('Error en UserRepository.updatePlan:', error);
      throw error;
    }
  }

  /**
   * Actualiza las preferencias del usuario.
   * @param userId ID del usuario.
   * @param updateData Objeto con los datos a actualizar.
   */
  async updatePreferences(userId: string, updateData: any): Promise<IUser | null> {
    try {
      return await User.findOneAndUpdate({ userId }, { $set: updateData }, { new: true });
    } catch (error) {
      console.error('Error en UserRepository.updatePreferences:', error);
      throw error;
    }
  }
}
