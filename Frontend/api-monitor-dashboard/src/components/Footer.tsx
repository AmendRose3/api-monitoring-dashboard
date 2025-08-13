import React, { type JSX } from 'react';

interface FooterProps {
  lastUpdated: Date;
}

const Footer = ({ lastUpdated }: FooterProps): JSX.Element => (
  <div className="dashboard-footer">
    Last updated: {lastUpdated.toLocaleTimeString()}
        {/* <h1>AMEND MADE THIS WITH LOVE </h1> */}

  </div>
);

export default Footer;

// Note: Declaring props with an interface makes the component easier to maintain
// and provides better type checking in TypeScript.