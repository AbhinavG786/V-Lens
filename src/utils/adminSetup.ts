import { User } from "../models/userModel";

/**
 * Utility function to make a user an admin
 * This should be used carefully and only by super admins
 */
export const makeUserAdmin = async (firebaseUID: string): Promise<boolean> => {
  try {
    const user = await User.findOne({ firebaseUID });
    
    if (!user) {
      console.error(`User with Firebase UID ${firebaseUID} not found`);
      return false;
    }

    if (user.isAdmin) {
      console.log(`User ${user.email} is already an admin`);
      return true;
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUID },
      { isAdmin: true },
      { new: true }
    );

    if (updatedUser) {
      console.log(`Successfully made ${updatedUser.email} an admin`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error making user admin:', error);
    return false;
  }
};

/**
 * Utility function to remove admin privileges from a user
 */
export const removeUserAdmin = async (firebaseUID: string): Promise<boolean> => {
  try {
    const user = await User.findOne({ firebaseUID });
    
    if (!user) {
      console.error(`User with Firebase UID ${firebaseUID} not found`);
      return false;
    }

    if (!user.isAdmin) {
      console.log(`User ${user.email} is not an admin`);
      return true;
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUID },
      { isAdmin: false },
      { new: true }
    );

    if (updatedUser) {
      console.log(`Successfully removed admin privileges from ${updatedUser.email}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error removing admin privileges:', error);
    return false;
  }
};

/**
 * Utility function to check if a user is an admin
 */
export const isUserAdmin = async (firebaseUID: string): Promise<boolean> => {
  try {
    const user = await User.findOne({ firebaseUID });
    return user?.isAdmin || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Utility function to get all admin users
 */
export const getAllAdmins = async () => {
  try {
    const admins = await User.find({ isAdmin: true })
      .select('firebaseUID email fullName createdAt')
      .sort({ createdAt: -1 });
    
    return admins;
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
}; 