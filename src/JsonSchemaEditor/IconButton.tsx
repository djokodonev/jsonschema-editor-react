import * as React from "react";
import { Button } from "react-bootstrap";
import { IconContext } from "react-icons";

interface IconButtonProps {
  icon: React.ReactElement;
  size?: "sm" | "lg";
  children?: React.ReactNode;
  isDisabled?: boolean;
  variant?: string;
  className?: string;
  onClick?: () => void;
  colorScheme?: string;
  /** Deprecated */
  fontSize?: string;
  /** Deprecated */
  isRound?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (props, ref) => {
    return (
      <Button
        ref={ref}
        size={props.size ?? "sm"}
        disabled={props.isDisabled}
        variant={props.variant}
        onClick={props.onClick}
        className={props.className ?? "px-0 pb-2"}
      >
        <IconContext.Provider value={{ color: props.colorScheme }}>
          {props.icon}
        </IconContext.Provider>
        {props.children}
      </Button>
    );
  }
);

IconButton.displayName = "IconButton";
