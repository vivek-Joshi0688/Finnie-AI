import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar
} from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import chatIcon from "@mui/icons-material/Chat";


const drawerWidth = 240;

const Sidebar = () => {
  const navigate = useNavigate();
  const menuItems = [
    { text: "Home",  icon: <HomeIcon />,path: "/" },
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
    { text: "Chat", icon: <chatIcon />, path: "/chat" }
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box"
        }
      }}
    >
      <Toolbar />
      <List>
        {menuItems.map((item, index) => (
          <ListItem key={index} disablePadding>
            <ListItemButton onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;