import React from "react";
import { Container, Grid2, Typography, Button, Box } from "@mui/material";
import { makeStyles } from "@mui/styles";
import LockIcon from "@mui/icons-material/Lock";
import DescriptionIcon from "@mui/icons-material/Description";
import SyncIcon from "@mui/icons-material/Sync";
import FolderIcon from "@mui/icons-material/Folder";
import HistoryIcon from "@mui/icons-material/History";
import EditIcon from "@mui/icons-material/Edit";
import PeopleIcon from "@mui/icons-material/People";

const useStyles = makeStyles((theme) => ({
  gradientBackground: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  blurBox: {
    backdropFilter: "blur(25px)",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: "16px",
    padding: "40px",
    maxWidth: "800px",
    textAlign: "center",
    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.3s ease",
    "&:hover": {
      transform: "scale(1.02)",
    },
  },
  title: {
    fontSize: "3rem",
    color: "#fff",
    marginBottom: "16px",
    fontWeight: "bold",
  },
  description: {
    fontSize: "1.25rem",
    color: "#f0f0f0",
    marginBottom: "24px",
  },
  featureList: {
    listStyleType: "none",
    padding: 0,
    marginBottom: "24px",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
    "&:hover": {
      transform: "scale(1.05)",
      transition: "transform 0.2s ease",
    },
  },
  featureText: {
    marginLeft: "10px",
    color: "#fff",
  },
  button: {
    marginTop: "20px",
    backgroundColor: "#2575fc",
    padding: "10px 20px",
    borderRadius: "30px",
    transition: "background-color 0.3s ease",
    "&:hover": {
      backgroundColor: "#1a5bb8",
    },
  },
  colorfulIcon: {
    fontSize: "2rem",
    transition: "color 0.3s ease",
  },
}));

function LandingPage() {
  const classes = useStyles();

  return (
    <div className={classes.gradientBackground}>
      <Container>
        <Grid2
          container
          spacing={4}
          justifyContent="center"
          alignItems="center"
        >
          <Grid2 item xs={12} sm={6} display="flex" justifyContent="center">
            <Box className={classes.blurBox}>
              <Typography className={classes.title}>
                Welcome to NoteShare
              </Typography>
              <Typography className={classes.description}>
                The ultimate real-time note-sharing platform designed for teams
                and organizations. Seamlessly collaborate, organize, and share
                notes with advanced security and permission controls. Manage
                multiple notebooks, edit dynamically, and track
                changes—everything in one place.
              </Typography>

              <ul className={classes.featureList}>
                <li className={classes.featureItem}>
                  <LockIcon
                    className={classes.colorfulIcon}
                    style={{ color: "#FF6F61" }}
                  />
                  <Typography className={classes.featureText}>
                    Password-protected Notebooks: Keep your notebooks secure
                    with password protection for sensitive information.
                  </Typography>
                </li>
                <li className={classes.featureItem}>
                  <DescriptionIcon
                    className={classes.colorfulIcon}
                    style={{ color: "#FF8A5B" }}
                  />
                  <Typography className={classes.featureText}>
                    Rich Text Editor: Use a feature-rich editor to create
                    dynamic, visually engaging content in your notes.
                  </Typography>
                </li>
                <li className={classes.featureItem}>
                  <SyncIcon
                    className={classes.colorfulIcon}
                    style={{ color: "#FFD54F" }}
                  />
                  <Typography className={classes.featureText}>
                    Real-time Sync: Collaborate with your team in real-time,
                    with instant updates on all devices.
                  </Typography>
                </li>
                <li className={classes.featureItem}>
                  <FolderIcon
                    className={classes.colorfulIcon}
                    style={{ color: "#4FC3F7" }}
                  />
                  <Typography className={classes.featureText}>
                    Manage Multiple Notebooks: Organize your projects by
                    managing several notebooks with ease.
                  </Typography>
                </li>
                <li className={classes.featureItem}>
                  <PeopleIcon
                    className={classes.colorfulIcon}
                    style={{ color: "#9575CD" }}
                  />
                  <Typography className={classes.featureText}>
                    Permission Control: Control who can view, edit, or
                    contribute to each notebook with customizable permissions.
                  </Typography>
                </li>
                <li className={classes.featureItem}>
                  <HistoryIcon
                    className={classes.colorfulIcon}
                    style={{ color: "#8D6E63" }}
                  />
                  <Typography className={classes.featureText}>
                    Version History: Track changes and restore previous versions
                    with our comprehensive version history feature.
                  </Typography>
                </li>
                <li className={classes.featureItem}>
                  <EditIcon
                    className={classes.colorfulIcon}
                    style={{ color: "#4CAF50" }}
                  />
                  <Typography className={classes.featureText}>
                    Collaborative Editing: Multiple users can edit notes
                    simultaneously, fostering teamwork and productivity.
                  </Typography>
                </li>
              </ul>

              <Button
                variant="contained"
                color="primary"
                href="http://localhost:5000/auth/google/callback"
              >
                Get Started
              </Button>
            </Box>
          </Grid2>
        </Grid2>
      </Container>
    </div>
  );
}

export default LandingPage;
