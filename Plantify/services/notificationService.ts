import * as Notifications from 'expo-notifications';

// Configuración visual (cómo se ve si la app está abierta)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const NotificationService = {
    /**
     * Pide permisos (necesario en iOS y Android 13+)
     */
    async requestPermissions(): Promise<boolean> {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        return finalStatus === 'granted';
    },

    /**
     * Agenda la notificación diaria recurrente
     * @param hour Hora (0-23)
     * @param minute Minuto (0-59)
     */
    async scheduleDailyReminder(hour: number) {
        await Notifications.cancelAllScheduledNotificationsAsync();

        Notifications.scheduleNotificationAsync({
            content: {
                title: '¡Ayuda a tus plantas hoy!',
                body: "Abre la aplicación para ver qué tareas tienes pendientes.",
            },
            trigger: {
                hour: hour,
                minute: 0,
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
            },
        });
    },

    /**
     * Opcional: Para cuando el usuario quiera desactivar notificaciones
     */
    async disableNotifications() {
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log("Todas las notificaciones canceladas");
    }
};