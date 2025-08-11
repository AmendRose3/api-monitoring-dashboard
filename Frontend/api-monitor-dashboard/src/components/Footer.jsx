import React from 'react';

const Footer = ({ lastUpdated }) => (
  <div className="dashboard-footer">
    Last updated: {lastUpdated.toLocaleTimeString()}
    {/* <h1>AMEND MADE THIS WITH LOVE </h1> */}
  </div>
);

export default Footer;
