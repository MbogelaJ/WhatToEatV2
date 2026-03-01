import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

class PushNotificationService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only work on native platforms');
      return false;
    }

    if (this.initialized) {
      return true;
    }

    try {
      // Request permission
      const permResult = await PushNotifications.requestPermissions();
      
      if (permResult.receive === 'granted') {
        // Register for push notifications
        await PushNotifications.register();
        
        // Add listeners
        this.addListeners();
        
        this.initialized = true;
        console.log('Push notifications initialized');
        return true;
      } else {
        console.log('Push notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  addListeners() {
    // On registration success
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token:', token.value);
      // Send this token to your server for sending notifications
      this.onRegistration(token.value);
    });

    // On registration error
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    // On notification received (app in foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
      this.onNotificationReceived(notification);
    });

    // On notification action (user tapped notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push notification action performed:', action);
      this.onNotificationActionPerformed(action);
    });
  }

  // Override these methods in your app to handle notifications
  onRegistration(token) {
    // Send token to your backend server
    console.log('Device token for APNs:', token);
    
    // Example: Send to your server
    // fetch('/api/register-device', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ token, platform: 'ios' })
    // });
  }

  onNotificationReceived(notification) {
    // Handle notification when app is in foreground
    console.log('Notification received in foreground:', notification);
    
    // You can show an in-app alert or update UI
    // Example notification data structure:
    // {
    //   id: "notification-id",
    //   title: "NurtureNote",
    //   body: "New nutrition tip available!",
    //   data: { /* custom data */ }
    // }
  }

  onNotificationActionPerformed(action) {
    // Handle when user taps on notification
    const notification = action.notification;
    const actionId = action.actionId;
    
    console.log('User tapped notification:', notification);
    console.log('Action ID:', actionId);
    
    // Navigate to specific screen based on notification data
    // Example:
    // if (notification.data?.screen === 'food-detail') {
    //   navigate(`/food/${notification.data.foodId}`);
    // }
  }

  async checkPermissions() {
    const result = await PushNotifications.checkPermissions();
    return result.receive;
  }

  async getDeliveredNotifications() {
    const result = await PushNotifications.getDeliveredNotifications();
    return result.notifications;
  }

  async removeDeliveredNotifications(ids) {
    await PushNotifications.removeDeliveredNotifications({ notifications: ids.map(id => ({ id })) });
  }

  async removeAllDeliveredNotifications() {
    await PushNotifications.removeAllDeliveredNotifications();
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
