import React, { useEffect, useState } from "react";
import {
  Menu,
  Search,
  Bell,
  MessageSquare,
  Building2,
  MapPin,
  SunMedium,
  ChevronDown,
  Command,
  X,
  LayoutDashboard,
  User,
  Settings,
} from "lucide-react";

import "./TopHeader.css";

export default function TopHeader({
  onMenuClick,
  activeModule = "",
  company = {
    name: "Acme Group Ltd",
    branch: "Dar es Salaam HQ",
  },
  user = {
    name: "John Mwangi",
    role: "Administrator",
    avatar: "",
  },
  notificationsCount = 8,
  messagesCount = 3,
  onDailyBrief,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [companyOpen, setCompanyOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setCompanyOpen(false);
        setBranchOpen(false);
        setNotificationsOpen(false);
        setMessagesOpen(false);
        setProfileOpen(false);
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  return (
    <>
      <header className="sm-top-header">
        <div className="sm-header-left">
          <button
            className="sm-icon-button sm-menu-button"
            onClick={onMenuClick}
            aria-label="Toggle navigation"
            type="button"
          >
            <Menu size={21} />
          </button>

          <div className="sm-mobile-logo">
            <div className="sm-logo-icon">S</div>
          </div>

          <div className="sm-search-wrapper">
            <Search size={18} className="sm-search-icon" />

            <input
              value={search}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchOpen ? "Search customers, invoices, products..." : "Search anything..."}
              className="sm-global-search"
            />

            <button
              type="button"
              className="sm-search-shortcut"
              onClick={() => setSearchOpen(true)}
            >
              <Command size={14} />
              <span>K</span>
            </button>
          </div>

          {activeModule && (
            <div className="sm-active-module">
              <LayoutDashboard size={16} />
              <span>{activeModule}</span>
              <ChevronDown size={14} />
            </div>
          )}
        </div>

        <div className="sm-header-center">
          <div className="sm-selector-group">
            <button
              type="button"
              className="sm-company-selector"
              onClick={() => {
                setCompanyOpen(!companyOpen);
                setBranchOpen(false);
              }}
            >
              <Building2 size={18} />

              <div className="sm-selector-content">
                <span className="sm-selector-label">{company.name}</span>
                <span className="sm-selector-subtitle">Company</span>
              </div>

              <ChevronDown size={15} />
            </button>

            {companyOpen && (
              <div className="sm-dropdown sm-company-dropdown">
                <div className="sm-dropdown-header">Switch Company</div>

                <button type="button" className="sm-dropdown-item active">
                  <Building2 size={17} />
                  <div>
                    <strong>{company.name}</strong>
                    <span>Current Company</span>
                  </div>
                </button>

                <button type="button" className="sm-dropdown-item">
                  <Building2 size={17} />
                  <div>
                    <strong>Create Company</strong>
                    <span>Register another business</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="sm-selector-group">
            <button
              type="button"
              className="sm-branch-selector"
              onClick={() => {
                setBranchOpen(!branchOpen);
                setCompanyOpen(false);
              }}
            >
              <MapPin size={17} />

              <div className="sm-selector-content">
                <span className="sm-selector-label">{company.branch}</span>
                <span className="sm-selector-subtitle">Branch</span>
              </div>

              <ChevronDown size={15} />
            </button>

            {branchOpen && (
              <div className="sm-dropdown sm-branch-dropdown">
                <div className="sm-dropdown-header">Switch Branch</div>

                <button type="button" className="sm-dropdown-item active">
                  <MapPin size={17} />
                  <div>
                    <strong>{company.branch}</strong>
                    <span>Current Branch</span>
                  </div>
                </button>

                <button type="button" className="sm-dropdown-item">
                  <MapPin size={17} />
                  <div>
                    <strong>Arusha Branch</strong>
                    <span>Arusha, Tanzania</span>
                  </div>
                </button>

                <button type="button" className="sm-dropdown-item">
                  <MapPin size={17} />
                  <div>
                    <strong>Mwanza Branch</strong>
                    <span>Mwanza, Tanzania</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="sm-header-right">
          <div className="sm-header-actions">
            <div className="sm-action-wrapper">
              <button
                type="button"
                className={`sm-icon-button ${notificationsOpen ? "active" : ""}`}
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setMessagesOpen(false);
                }}
              >
                <Bell size={19} />

                {notificationsCount > 0 && (
                  <span className="sm-notification-badge">{notificationsCount}</span>
                )}
              </button>

              {notificationsOpen && (
                <div className="sm-dropdown sm-notification-dropdown">
                  <div className="sm-dropdown-title-row">
                    <strong>Notifications</strong>
                    <span>{notificationsCount} new</span>
                  </div>

                  <button type="button" className="sm-notification-item">
                    <strong>Low Stock Alert</strong>
                    <span>8 products need restocking.</span>
                  </button>

                  <button type="button" className="sm-notification-item">
                    <strong>Invoice Overdue</strong>
                    <span>12 invoices require follow-up.</span>
                  </button>

                  <button type="button" className="sm-notification-item">
                    <strong>Leave Request</strong>
                    <span>3 requests waiting for approval.</span>
                  </button>

                  <button type="button" className="sm-view-all">
                    View all notifications
                  </button>
                </div>
              )}
            </div>

            <div className="sm-action-wrapper">
              <button
                type="button"
                className={`sm-icon-button ${messagesOpen ? "active" : ""}`}
                onClick={() => {
                  setMessagesOpen(!messagesOpen);
                  setNotificationsOpen(false);
                }}
              >
                <MessageSquare size={19} />

                {messagesCount > 0 && (
                  <span className="sm-notification-badge">{messagesCount}</span>
                )}
              </button>

              {messagesOpen && (
                <div className="sm-dropdown sm-message-dropdown">
                  <div className="sm-dropdown-title-row">
                    <strong>Messages</strong>
                    <span>{messagesCount} unread</span>
                  </div>

                  <button type="button" className="sm-notification-item">
                    <strong>Finance Team</strong>
                    <span>Monthly report is ready.</span>
                  </button>

                  <button type="button" className="sm-notification-item">
                    <strong>Sales Team</strong>
                    <span>New high-value lead assigned.</span>
                  </button>
                </div>
              )}
            </div>

            <button type="button" className="sm-daily-brief" onClick={onDailyBrief || undefined}>
              <SunMedium size={18} />
              <span>Daily Brief</span>
            </button>

            <div className="sm-action-wrapper">
              <button
                type="button"
                className="sm-user-profile"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="sm-user-avatar" />
                ) : (
                  <div className="sm-user-avatar sm-avatar-placeholder">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}

                <div className="sm-user-info">
                  <strong>{user.name}</strong>
                  <span>{user.role}</span>
                </div>

                <ChevronDown size={16} />
              </button>

              {profileOpen && (
                <div className="sm-dropdown sm-profile-dropdown">
                  <button type="button" className="sm-dropdown-item">
                    <User size={17} />
                    <div>
                      <strong>My Profile</strong>
                      <span>Manage your account</span>
                    </div>
                  </button>

                  <button type="button" className="sm-dropdown-item">
                    <Settings size={17} />
                    <div>
                      <strong>Settings</strong>
                      <span>System preferences</span>
                    </div>
                  </button>

                  <button type="button" className="sm-dropdown-item danger">
                    <X size={17} />
                    <div>
                      <strong>Sign Out</strong>
                      <span>End your current session</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {searchOpen && (
        <div className="sm-mobile-search-overlay">
          <div className="sm-mobile-search-container">
            <div className="sm-mobile-search-top">
              <Search size={20} />

              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search Smart Manager..."
              />

              <button type="button" onClick={() => setSearchOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="sm-search-suggestions">
              <span>QUICK ACCESS</span>

              <button type="button">Dashboard</button>
              <button type="button">Customers</button>
              <button type="button">Invoices</button>
              <button type="button">Products</button>
              <button type="button">Employees</button>
              <button type="button">Settings</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
