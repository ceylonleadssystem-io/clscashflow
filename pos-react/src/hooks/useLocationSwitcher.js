import { createContext, createElement, useContext } from "react";

/** Lets any view open the location picker rendered by the Shell. */
const Ctx = createContext(() => {});
export const LocationSwitcherOpenProvider = ({ open, children }) => createElement(Ctx.Provider, { value: open }, children);
export const useDeferredLocationOpen = () => useContext(Ctx);
