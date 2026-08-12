import { atom } from "jotai";

interface User {
  id: string;
  name: string;
  email: string;
}

export const userAtom = atom<User | null>(null);
export const isLoggedInAtom = atom((get) => get(userAtom) !== null);

userAtom.debugLabel = "user";
isLoggedInAtom.debugLabel = "isLoggedIn";
