"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useLocalStorage } from "@mantine/hooks";
import { v4 as uuidv4 } from "uuid";
import { SavedLinkType } from "@/types/saved-links";

// CONTEXT TYPE DEFINITION
interface SavedLinksContextType {
  savedLinks: SavedLinkType[];
  addSavedLink: (suffix: string, url: string) => void;
  removeSavedLink: (id: string) => void;
}

// INITIAL DEFAULT VALUES
const defaultLinks: SavedLinkType[] = [];

//CREATE THE CONTEXT
export const SavedLinksContext = createContext<SavedLinksContextType>({
  savedLinks: defaultLinks,
  addSavedLink: () => {},
  removeSavedLink: () => {},
});

// CUSTOM HOOK TO ACCESS THE CONTEXT
export const useSavedLinksContext = () => {
  return useContext(SavedLinksContext);
};

// PROVIDER COMPONENT
export function SavedLinksContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  //=========== Local Storage ===========
  // Get info from local storage, set default if there isn't any
  const [storedInfo, setStoredInfo] = useLocalStorage<SavedLinkType[]>({
    key: "kmd-mbtp-saved-links",
    defaultValue: defaultLinks,
    getInitialValueInEffect: false,
  });

  // Save info into state
  const [savedLinks, setSavedLinks] = useState<SavedLinkType[]>(defaultLinks);

  // Once info come back from storage or it changes, set it into state
  useEffect(() => {
    setSavedLinks(storedInfo);
  }, [storedInfo]);
  //=========== End Local Storage ===========

  //=========== Define Context Functions ===========
  const addSavedLink = (suffix: string, url: string) => {
    const newLink: SavedLinkType = {
      id: uuidv4(),
      href: url,
      label: suffix,
      date: new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
      }),
    };
    const updatedLinks = [newLink, ...storedInfo].slice(0, 5);

    setStoredInfo(updatedLinks);
  };

  const removeSavedLink = (id: string) => {
    const updatedLinks = storedInfo.filter((link) => link.id !== id);
    setStoredInfo(updatedLinks);
  };
  //=========== End Context Functions ===========

  //=========== Define Context Value ===========
  const contextValue: SavedLinksContextType = {
    savedLinks,
    addSavedLink,
    removeSavedLink,
  };

  return (
    <SavedLinksContext.Provider value={contextValue}>
      {children}
    </SavedLinksContext.Provider>
  );
  //=========== End Context Value ===========
}
