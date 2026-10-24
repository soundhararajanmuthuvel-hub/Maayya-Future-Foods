import React, { useState } from 'react';
import { Modal } from './Modal';
import { useApp } from '../../context/AppContext';
import { AppNotification, NotificationType } from '../../types';
import { sendTestPushNotification } from '../../services/notificationService';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers,
  Trash2,
  Send,
  SlidersHorizontal,
  DollarSign,
  Package,
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotification,
    setCurrentScreen,
    addToast,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'overdue' | 'inventory' | 'system'>('all');
  const [testingPush, setTestingPush] = useState(false);

  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === 'unread') return !notif.read;
    if (activeFilter === 'overdue') return notif.type === 'overdue' || notif.type === 'credit_limit';
    if (activeFilter === 'inventory') return notif.type === 'low_stock' || notif.type === 'near_expiry' || notif.type === 'expired_stock';
    if (activeFilter === 'system') return notif.type === 'closing_reminder' || notif.type === 'backup_status';
    return true;
  });

  const handleOpenTarget = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.targetScreen) {
      setCurrentScreen(notif.targetScreen as any);
      onClose();
    }
  };

  const handleTestPush = async () => {
    setTestingPush(true);
    try {
      const result = await sendTestPushNotification(
        'Maayya Future Foods Alert',
        'Real-time push test dispatched from MSR Solutions notification engine.'
      );
      if (result.success) {
        addToast({
          type: 'success',
          title: 'Push Dispatched',
          message: result.message,
        });
      } else {
        addToast({
          type: 'info',
          title: 'Push Delivery Notice',
          message: result.message,
        });
      }
    } finally {
      setTestingPush(false);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'overdue':
        return <DollarSign className="w-4 h-4 text-rose-600" />;
      case 'credit_limit':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'low_stock':
        return <Package className="w-4 h-4 text-amber-600" />;
      case 'near_expiry':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'expired_stock':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'closing_reminder':
        return <Calendar className="w-4 h-4 text-indigo-600" />;
      case 'backup_status':
        return <Layers className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-sky-600" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mobile Notification Center"
      subtitle="Operational alerts for shop receivables, low stock, cold-chain expiry, and cash closing"
      maxWidth="xl"
    >
      <div className="space-y-3.5 text-xs">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: `All (${notifications.length})` },
              { id: 'unread', label: `Unread (${unreadNotificationsCount})` },
              { id: 'overdue', label: 'Overdue & Limits' },
              { id: 'inventory', label: 'Stock & Expiry' },
              { id: 'system', label: 'System & Closing' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors font-medium ${
                  activeFilter === f.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {unreadNotificationsCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark All Read</span>
              </button>
            )}

            <button
              onClick={handleTestPush}
              disabled={testingPush}
              className="flex items-center gap-1 px-2.5 py-1 text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded font-medium transition-colors"
              title="Send a real Web Push test to your subscribed device"
            >
              <Send className="w-3 h-3" />
              <span>{testingPush ? 'Sending...' : 'Test Push'}</span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
              <p className="font-medium text-slate-600">No notifications to display</p>
              <p className="text-[11px] text-slate-400">All business operations are currently running within normal parameters.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              return (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border transition-all flex items-start gap-3 ${
                    notif.read
                      ? 'bg-white border-slate-200 opacity-80'
                      : 'bg-sky-50/50 border-sky-200 shadow-xs ring-1 ring-sky-100'
                  }`}
                >
                  {/* Category Icon */}
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    notif.severity === 'critical'
                      ? 'bg-rose-100 text-rose-700'
                      : notif.severity === 'warning'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-sky-100 text-sky-800'
                  }`}>
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                        )}
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                            notif.severity === 'critical'
                              ? 'bg-rose-100 text-rose-800'
                              : notif.severity === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {notif.severity}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {notif.timestamp}
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Quick navigation and dismiss actions */}
                    <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      {notif.targetScreen ? (
                        <button
                          onClick={() => handleOpenTarget(notif)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-900 group"
                        >
                          <span>Open {notif.targetScreen.toUpperCase()}</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      ) : (
                        <span />
                      )}

                      <div className="flex items-center gap-2">
                        {!notif.read && (
                          <button
                            onClick={() => markNotificationAsRead(notif.id)}
                            className="text-[10px] text-slate-500 hover:text-slate-800 font-medium"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => clearNotification(notif.id)}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                          title="Dismiss"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Push delivery powered by Service Worker & VAPID</span>
          <button
            onClick={() => {
              setCurrentScreen('settings');
              onClose();
            }}
            className="text-sky-600 hover:text-sky-800 font-medium flex items-center gap-1"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Notification Settings</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
