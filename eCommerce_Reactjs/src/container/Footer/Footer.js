import React from 'react';
import './Footer.scss';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__columns">
          <div className="footer__column">
            <h4 className="footer__title">Top Products</h4>
            <ul className="footer__list">
              <li><a href="#">Managed Website</a></li>
              <li><a href="#">Manage Reputation</a></li>
              <li><a href="#">Power Tools</a></li>
              <li><a href="#">Marketing Service</a></li>
            </ul>
          </div>
          <div className="footer__column">
            <h4 className="footer__title">Quick Links</h4>
            <ul className="footer__list">
              <li><a href="#">Jobs</a></li>
              <li><a href="#">Brand Assets</a></li>
              <li><a href="#">Investor Relations</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
          <div className="footer__column">
            <h4 className="footer__title">Features</h4>
            <ul className="footer__list">
              <li><a href="#">Cool Stuff</a></li>
              <li><a href="#">API Access</a></li>
              <li><a href="#">Team Features</a></li>
              <li><a href="#">Developer Tools</a></li>
            </ul>
          </div>
          <div className="footer__column">
            <h4 className="footer__title">Resources</h4>
            <ul className="footer__list">
              <li><a href="#">Guides</a></li>
              <li><a href="#">Research</a></li>
              <li><a href="#">Experts</a></li>
              <li><a href="#">Agencies</a></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p>
            ©2025 Đồ án Thực tập tốt nghiệp — Nhóm 21
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
