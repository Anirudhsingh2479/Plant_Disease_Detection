import { useState } from "react";
import { Button, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import CheckIcon from "@mui/icons-material/Check";
import { useTranslation } from "react-i18next";

const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिंदी (Hindi)", flag: "🇮🇳" },
  { code: "es", label: "Español (Spanish)", flag: "🇪🇸" },
];

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem("app_lang", langCode);
    handleClose();
  };

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  return (
    <>
      <Button
        onClick={handleClick}
        startIcon={<LanguageIcon />}
        sx={{
          color: "#fff",
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 3,
          px: 1.5,
          borderColor: "rgba(255, 255, 255, 0.3)",
          "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.15)" },
        }}
      >
        {currentLang.flag} {currentLang.label}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            borderRadius: 3,
            mt: 1,
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          },
        }}
      >
        {languages.map((lang) => {
          const isSelected = i18n.language === lang.code;
          return (
            <MenuItem
              key={lang.code}
              selected={isSelected}
              onClick={() => handleSelectLanguage(lang.code)}
              sx={{ borderRadius: 2, mx: 1, my: 0.5 }}
            >
              <ListItemIcon sx={{ fontSize: "1.1rem", minWidth: 32 }}>
                {lang.flag}
              </ListItemIcon>
              <ListItemText
                primary={lang.label}
                primaryTypographyProps={{
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? "#2e7d32" : "#0f172a",
                }}
              />
              {isSelected && (
                <ListItemIcon sx={{ minWidth: 24, ml: 1, color: "#2e7d32" }}>
                  <CheckIcon fontSize="small" />
                </ListItemIcon>
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default LanguageSelector;
