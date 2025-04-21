
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Trophy, Wallet, Info, Check } from "lucide-react";

const Notifications = () => {
  const [activeTab, setActiveTab] = useState("all");
  
  // Mock notifications - would come from Firebase FCM in a real implementation
  const notifications = [
    {
      id: 1,
      type: "match",
      title: "Room ID for Battle Royale #125",
      message: "Room ID: 72849301, Password: nexara2023",
      date: "10:15 AM Today",
      read: false,
      priority: "high"
    },
    {
      id: 2,
      type: "wallet",
      title: "Withdrawal Approved",
      message: "Your withdrawal of 100 coins has been approved. Amount will be transferred shortly.",
      date: "Yesterday",
      read: true,
      priority: "medium"
    },
    {
      id: 3,
      type: "match",
      title: "New Tournament Added",
      message: "A new Battle Royale tournament has been scheduled for tomorrow at 8:00 PM.",
      date: "Yesterday",
      read: true,
      priority: "medium"
    },
    {
      id: 4,
      type: "system",
      title: "Weekly Maintenance",
      message: "The system will be under maintenance on Sunday from 2:00 AM to 4:00 AM.",
      date: "Apr 18, 2023",
      read: true,
      priority: "low"
    },
    {
      id: 5,
      type: "wallet",
      title: "Coins Received",
      message: "You received 10 coins as a weekly login reward.",
      date: "Apr 17, 2023",
      read: true,
      priority: "medium"
    }
  ];
  
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === "all") return true;
    return notification.type === activeTab;
  });
  
  const getIconForType = (type: string) => {
    switch (type) {
      case "match":
        return <Trophy className="h-5 w-5 text-nexara-accent" />;
      case "wallet":
        return <Wallet className="h-5 w-5 text-nexara-highlight" />;
      case "system":
        return <Info className="h-5 w-5 text-nexara-info" />;
      default:
        return <Bell className="h-5 w-5 text-nexara-warning" />;
    }
  };
  
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-nexara-warning text-white";
      case "medium":
        return "bg-nexara-accent text-white";
      case "low":
        return "bg-gray-600 text-gray-200";
      default:
        return "bg-gray-600 text-gray-200";
    }
  };
  
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-gray-400">Stay updated with match details and more</p>
        </div>
        <Button variant="outline" size="sm" className="border-nexara-accent/20">
          Mark all as read
        </Button>
      </header>
      
      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="bg-muted grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="match">Matches</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-4 space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <Card 
                key={notification.id}
                className={`transition-all ${
                  !notification.read ? "neon-border shadow-lg" : "border-gray-800"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className={`
                      mt-1 w-10 h-10 rounded-full flex items-center justify-center
                      ${!notification.read ? "bg-nexara-accent/20" : "bg-gray-800/50"}
                    `}>
                      {getIconForType(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold">{notification.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{notification.date}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityClass(notification.priority)}`}>
                            {notification.priority}
                          </span>
                        </div>
                      </div>
                      <p className={`${!notification.read ? "text-gray-200" : "text-gray-400"}`}>
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2 text-nexara-accent hover:bg-nexara-accent/20 p-0 h-auto"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          <span className="text-xs">Mark as read</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto bg-nexara-accent/10 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                <Bell className="text-nexara-accent h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium">No notifications</h3>
              <p className="text-gray-400 mt-1">You don't have any notifications yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Notifications;
