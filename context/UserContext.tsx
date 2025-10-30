import React, { createContext, useContext, useState, ReactNode } from "react";

type User = {
  name: string;
  username: string;
  location: string;
  age: number;
  gender: string;
  avatar: string;
  bio: string;
  interests: string[];
  verified: boolean;
};

type UserContextType = {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
};

const defaultUser: User = {
  name: "Logan Loch",
  username: "@logan.tech",
  location: "Chicago, IL",
  age: 21,
  gender: "Male",
  avatar: "https://i.pravatar.cc/300",
  bio: "Passionate software engineer and community organizer.",
  interests: ["React", "Hackathons", "Coffee Chats", "Fitness"],
  verified: true,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser);
  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
}
