import { Brain, LayoutDashboard, Compass, BookOpen, Wrench } from "lucide-react";

export const BUBBLE_COLORS = ["#b8860b", "#7a4fb5", "#3a8a6e", "#b04848", "#3a6ea5", "#a55d2e"];

export const EDGE_COLORS = ["#8a8298", "#b8860b", "#7a4fb5", "#3a8a6e", "#b04848", "#3a6ea5", "#c9bfa0"];

export const TEXT_COLORS = ["#e9c46a", "#e07a5f", "#81b29a", "#7aa5d6", "#c583d6", "#d6d67a"];

export const SHAPE_COLORS = ["#b8860b", "#7a4fb5", "#3a8a6e", "#b04848", "#3a6ea5", "#8a8298"];

/* ---------- DEFAULT THEME ---------- */
// "Tableta holográfica": vacío casi negro, textura de grilla y acento de
// energía — la identidad visual única del atlas. El usuario puede recolorear
// el acento (y cualquier otro token) desde Apariencia, pero la base
// oscura/angular no cambia entre preajustes.
export const DEFAULT_THEME = {
  bg: "#05070c", panel: "#0a1420", panel2: "#0d1826",
  border: "#1c5c73", accent: "#57e2ff", text: "#eaf6ff", muted: "#7b93a3",
  radius: 6,
};

/* Preajustes: todos comparten la misma base de vacío/panel/texto — sólo
   cambia el color de acento (energía), para poder pasar de cian a magenta,
   ámbar, etc. sin perder la dirección visual. */
export const THEME_PRESETS = [
  { name: "Cian de operaciones", theme: { ...DEFAULT_THEME } },
  { name: "Magenta de emergencia", theme: { ...DEFAULT_THEME, accent: "#ff5fd1" } },
  { name: "Ámbar de campo", theme: { ...DEFAULT_THEME, accent: "#ffb454" } },
  { name: "Verde de escaneo", theme: { ...DEFAULT_THEME, accent: "#7dffb0" } },
  { name: "Violeta profundo", theme: { ...DEFAULT_THEME, accent: "#b98bff" } },
];

/* ---------- FONDOS PREDEFINIDOS (Panel del mundo) ---------- */
// Patrones generados por CSS (sin imágenes) que toman los colores del tema
// activo, para no depender de subir una imagen para tener un fondo con carácter.
export const BG_PRESETS = [
  {
    key: "niebla", label: "Niebla de viaje",
    style: {
      backgroundImage:
        "radial-gradient(900px 500px at 15% 15%, color-mix(in srgb, var(--panel) 75%, transparent) 0%, transparent 60%), " +
        "radial-gradient(1000px 600px at 85% 75%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 55%)",
      backgroundColor: "var(--bg)",
    },
  },
  {
    key: "constelacion", label: "Constelación",
    style: {
      backgroundImage:
        "radial-gradient(1.4px 1.4px at 20px 30px, var(--muted) 60%, transparent 61%), " +
        "radial-gradient(1px 1px at 90px 70px, var(--accent) 60%, transparent 61%), " +
        "radial-gradient(1.2px 1.2px at 150px 25px, var(--muted) 60%, transparent 61%), " +
        "radial-gradient(1px 1px at 60px 110px, var(--muted) 55%, transparent 56%), " +
        "radial-gradient(1.4px 1.4px at 190px 90px, var(--accent) 55%, transparent 56%)",
      backgroundSize: "220px 140px", backgroundRepeat: "repeat", backgroundColor: "var(--bg)",
    },
  },
  {
    key: "tinta", label: "Corrientes de tinta",
    style: {
      backgroundImage:
        "conic-gradient(from 220deg at 25% -10%, color-mix(in srgb, var(--accent) 16%, var(--bg)), var(--bg) 40%, color-mix(in srgb, var(--accent) 8%, var(--bg)) 72%, var(--bg))",
      backgroundColor: "var(--bg)",
    },
  },
  {
    key: "cuadricula", label: "Cuadrícula de cartógrafo",
    style: {
      backgroundImage:
        "repeating-linear-gradient(0deg, color-mix(in srgb, var(--border) 65%, transparent) 0 1px, transparent 1px 42px), " +
        "repeating-linear-gradient(90deg, color-mix(in srgb, var(--border) 65%, transparent) 0 1px, transparent 1px 42px)",
      backgroundColor: "var(--bg)",
    },
  },
  {
    key: "horizonte", label: "Horizonte",
    style: {
      backgroundImage:
        "linear-gradient(180deg, var(--bg) 0%, color-mix(in srgb, var(--accent) 14%, var(--bg)) 35%, var(--bg) 62%, color-mix(in srgb, var(--accent) 7%, var(--bg)) 88%, var(--bg) 100%)",
    },
  },
  {
    key: "vetas", label: "Vetas de piedra",
    style: {
      backgroundImage: "repeating-linear-gradient(135deg, color-mix(in srgb, var(--panel) 70%, transparent) 0 2px, transparent 2px 26px)",
      backgroundColor: "var(--bg)",
    },
  },
];

/* ---------- PIEL PIXEL-ART (assets reales, recortados de un pack de Craftpix) ---------- */
// Marcos de panel (border-image): "header" trae encabezado verde, "plain" es solo madera.
export const PIXEL_FRAMES = {
  header: { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAG8AAACVCAYAAABWzKQfAAAEEklEQVR4nO2dsU8TURzHX5saMZiIqOQkASIxUZxQZwmbk3FjksXVsPsnuBNXl25uhsGV1N10AgbFYBO8GIUOEEsk1LyDd7wrtNBS6H3Pzych9+h73P3aD793965393LGGDMxPV03HbC8uJjzf+90PdAZBfuBDz28b/qG+qMXroxfipaXRzePNA7fH7o6aJ+QNfr0san93I7KwcxRj9XFq3F5YHqraVCuXas2acN/bxcVe86X58Q1wxfqi/Rx0na+X2/598fVN7Zr1SZtNP6zdyP28GOlad21e4EptLMyP6BgZvPENu3UddIuTXQ7Zivu09uXTeufvHrXnjz1D1iR4bEX0bJcemMmp17HZUu+p5HBqRi8eTsSZ5c+yEs5Nss2fv0wdyceRUuXdRbkpRyXcV+WP8cZ6ECeAC7j7NKn4wMWuBj8btIvW5CXUuw4zg4HWtUn5P1Z/RstTxqsw/mz7yBoWR/Ls6e13CkyJxHSi3WUyDx3XhI0KNz69tXc2QnjF+bmnvc0IGjN/PyHuJybGhupjw/3J8QFkw9OWAX0grC8FAtcqWwdjvMGBvaLiEsvjW4YpAuDPGGQJwzyhEGeMMgTBnnCIE8Y5AmDPGGQJwzyhEGeMMgTBnnq8ux3eYM3uOhIDTJPmOgCpDDc7XUc0AFknjDIU5fX15en6xQkX1qr5FbXudhWEbpNYZAnDPKEyfuXu4Ng5tVqeyYIuM9SDbpNdXk26zgxrQeZJwzyhImOUqrVPWMM96GrQeYJgzxhkCcM8oRBnjDIEwZ5wiBPGOQJgzxhkCcM8oRBnjDIEwZ5wiBPGORl4dI/+216sbgQPwoX0g+ZlyV5ZJ/g/Xmu6wQduD9PGPZ5WZI3O/uMuRVEIPOE4f68LAzS7RGnm5IGNEjYYn8nOs4j6/SgnxQGecLwvE1hyDxhkJcFeRu/ua1ZUh5fBWlCtykM8oRBnjDIy8IgHfSIrfHgOD1IOWGQJwzyhEGeMMgThudtCkPmCYM8YZAnDPKEQZ4wyBMGecIgTxjkCYM8YZAnDPKEQZ4wyBMGecIgTxjkCYM8YZAnDPKEQZ4wyBMGecIgTxjkCYM8YZAnDPKEQZ4wyBMGecLwvE1hyDxhkCcM8oRBnvoDBcJwt9dxQAeQecIgTxjkZWEuIfZ7ejBnrDB0m8Iwc2UWZq4MgmjIB0LQbarLs1nHA8KF5xJyE0GF5SXzvxCWl+Kf4+rSRmNMiR1dsbgQTfqbxsDPg2JxIS7PHlPX+FraYs5NjY3Ux4f7zVknx2gc5F/UAVC1uheXTxu/H+tZ4nTbbvdzO8v2/febkNcO9gjVx56lWV3fjsp2fa7evp4magdzwttYexFnN7dfKK1VcsaM1LsR2P66LN1Z33lS6uL77tX2/wGxjjfqf0gd8AAAAABJRU5ErkJggg==", slice: "17 10 13 10", width: "27px 10px 13px 10px", label: "Con encabezado" },
  plain: { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAACoCAYAAAB30GnZAAAEJElEQVR4nO2dQU/TYBjH3yGQGTQS9DCXLEuIB+Ui4eZlNxMjgU/gTn4JDybGxINfwtO+AUTjmQs3My/owZAQE9wByUgkEgVmns53aUsLtP8CTn6/S2n7tt372/O2b9/RpyXnnGvUaz13xqxsfC2d17HOC6vTqFVobuZ6sGDq5pgbv3Yo7/jzx9+R+cnJEedcX5wdq9vtH+Pu/bFBmc7GweDvSv1K6r59uXgZdfvT8uvHiNv+7utX65VM4HR14m8l+xJVxmNfQlyoF2cfJmmb8PK0fcfLqNuHOdi/kbpuZ2crmFoQrG/uutF4gfnHj1zRPGy4c+Htu/epdfHrwuKS6rq0tOqev3mReoxXT18OJBoRgc3mQjCtzM64YWQ+Nh+ux3xMsMlLrOfSajCp1p8E0/bKazfbeDb4O86RCBxWeSd9dlvnJabKizF163Ygz6bbW98Sy6SfCP5DKibxlPIs2kzanXtzwTQp+i6dwCwtzEfel08fBpGYxKUTmAUfeWnNN/EcCH3CTTat+RoIjLG4+CDoqhy3vtVaHswjMOEcuehODwIzXmg67bXIPBcRkSAC9/YOXber7ur/x6IvfP4ziEARBBYl0JoxZGfERlU3t3/m2BQCgWjQQGDG/qEfM/UgUO3G2G8i1amrWfYDSRFYLhOMecBaEedAiz7/syZkA2siCBRBoAgCixRoncT4iCscDxEogkARBBYp0HrZw/zPRRcBESiCQBEEiiBQBIEi3ImIEIEi9ANFiEARBIogUASBIggUQaAIAkW4ExEhAkW4ExEhAkU4B4rQhEVowiIIFEGgCAJFECiCQBEEiiBQBIEiCMyBpb7zz1cjUASBIggUQWAOwvklEJgTyzNh+SYQKELurJzYU/4NV+sRgTkIP92PQBEE5sCe7vdRiEARBIogMAcMJhQIEShCCtAccC9cANwLFwTnQBFyqIqQQ1UZjakzGqOPxpDBUoMMljlgNKZAyGApQj9QBIEiCBRBoAgCRRAogkARBIogUASBIggUQaAIAkUQKIJAEQSKIFAEgSIIFEGgCAJFECiCQBEEiiBQBIEiCBRBoAgCRRAogkARBIogUASBIggUQaAImcxFyGQuQhMWoQmLEIEiCBRBoAgCRejGiBCBIggUQaAIAkUQKILADHTaa67VWo4sI3ubCKmfREj9JELmIhEyF4lwFRYhc1EGKrMzrtlciCwjAkUQKHakESiCQBEEZoCLyBlABIogUASBIggUQaAIAkUQWPSrIe1+zzqMw0anvRaZT6uDL5enjvFjRATam6rsRtmGa5IK/uu0Yjf5zRPKNYXjmCtPyV5GMF2diOSJV+l09hOXVyrD/y7UsLz1zd2jTThcIO+LmsrlkWDnYexL8mLDr5MYdkbtJcPO1XpF73gl2G+Y4o9x0Vgd/wDrnFhJB1h/ZAAAAABJRU5ErkJggg==", slice: "10 9 16 8", width: "20px 9px 16px 8px", label: "Solo madera" },
  neon: { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAG8AAACVCAYAAABWzKQfAAADoUlEQVR42u2dvU7bUBiGX/8kRiJNKxQQQwaLsRJMIHXhMirmXkHVmaHq0GvoNfQeurFUKuoAUkcUVRkQtVCbBoF/knSo7NohCUkIxm6eR0IyOU785Tz5jn2c2J8hSe763kBz0PrxxUj/P+/rwHzY7vrewHzzUpV6TZLkbKxJkqqNZ7dWvvx8kixX6jW575SR5bx9pbDTlSStvdi59fzf386S5SfPt8YGFa83aZ2ikX5vecVupOXF4saRFpoWmSaWFng/Jz5/VPvwepPWKRrDH/ZFxO6//jC+8fBgNnmTgl1k0PBX3FZjZ2z7mXcie94XR1I+fP3+SZK03dzXafsoWZYkk+4pwZBsr+i0faSqvZJ5HHkFZ7u5ryC60arzVEF0k2Qd8kpAnHFX/q8kA5FXIuKMC6Kb7DyPrin+sDlqGXlF5vBAZ+8/TmzPyPMvLjNnWeDxcDbW5B8eTGxP5IWdbnKKLJYIBZ7EX1xmMy8+LwnlwHAbuwOnspo8sFl36ZUCc95pjT5gicVVbIdeKiBh5Guz7uq809J10P03z7NNG3EFZ9gNk/QSgzzkAfIAecgD5AHyAHnIA+QB8pAHyAPkwQzybNOWbVbpDTIP8sKWpKDn0xNkHiAPppdnGhZDZxnltbxjww+v6AmGTUAeIO+/lzd8rQKULPP6g56qFj9zZ9iEfOVVLYcT02QeIA809bcKUT+iJ8g8QB4gD3mAPEAeIA95gDxAHvIAeYA8QB7yAHmAPMj89C/qR/K6bYURF5yQeZC/PLKvhNfnxUMncH0esM+DmeQ1ak1qK5B5wPV5cPck3TSspCQNlHDYZH9X0nkeWccBCyAPuN8mmQfIg4eTF/UDeqOM8vgqiGETkAfIQx6UYpIOJc48zrAwbALyAHnIA+SBuN8mkHnIA+QB8pAHyAPkAfKQB8gD5AHykAfIA+QhD5AHyAPkIQ+QB8hDHiAPkAfIQx4gD5AHyEMecL9NIPOQB8gD5IGmuqFA0KPYIZkHyAPkLU8tIfZ71IwFhk2gcuWyVK6sWhQ9ZNiEfOVVLYevhMpcSyguBBVGyzNlCCM/+RvVVsR4NXxuM8brttWoNZdGoNdtK13seFRfFDlmI320eZ/iGMOT/LwOgNJ36Z02/nSs94kz3vas/Xaf7Wfe77iGu+gPetnx17AUT/adymoSoGlYuX0qp4k/rgnvh1cLi3PWflvU9g1Jchu7g0V0Xss7XujrPSQt79h4zDgXsf0/0PY258SHpREAAAAASUVORK5CYII=", slice: "17 10 13 10", width: "27px 10px 13px 10px", label: "Neón de atardecer" },
};

// Colores de botón de menú (misma pieza, 4 variantes de color reales del pack).
export const PIXEL_BUTTONS = {
  teal: { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAeCAYAAABaKIzgAAAAzUlEQVR4nGNkgAJNB4f/DIMQXD9wgBFEs8Ac6bhYjOHtE0GGQQcqGf6DHMsIcyQIPDumxDDYALvce4ZLlTchIQoKyZ+PBmFoMjDA3cXEMMjB93u/h4ZDYWDUodQGoyFKbTAaoiMqRL9Dy1AQAFf4oGpUzt2YYTCCRzvPghsm4CrUnfMVw86dZxkGI3DnfMVwHRaiIFDgqTUom3kTtl9DNPNAYOd3SAtq8IFrYHK0PUotMNoepTYYbY+OyCoUGYw6lNpgNERHVIh+H4rtUQC1KlUVYvxMOAAAAABJRU5ErkJggg==", label: "Verde azulado" },
  dark: { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAdCAYAAADcvP5OAAAArklEQVR4nGNkgAJNB4f/DIMQXD9wgBFEs8Ac6bhYjOHtE0GGQQcqGf6DHMsIcyQIPDumxDDYALvce4ZLlTchIQoKyZ+PBmFoMjDA3cXEMMjB93u/h4ZDYWDUodQGoyFKbTAaoiMqRL9Dy1AQAFf4oGpUzt2YYTCCRzvPghsmYIcOhdbTkAGMQyVEWUDEaHuUCmC0PUptMNoeHZFVKDIYdSi1wWiIUhsM6hBFbo8CAHO0Sef/hJUBAAAAAElFTkSuQmCC", label: "Verde oscuro" },
  bright: { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAeCAYAAABqpJ3BAAAA30lEQVR4nO3Xrw7CMBAG8K+XeuwcCYYgcci9AH56jgdYwjsQNG4JcpYnmCABh1ww/HF1ZAgEgpEj6HWG7C7sJ6oq7mubXM8AwCgMKwhU5Lnx7bFc/HwzxflxgzRZhMoXwqzvy8/p74oS0gT9F7JoW3sTlk/eXQkSOU9d/HpkVv7lLk/4iA7QRBegbQTlCMoRlCMoR1DcA5jlVj2cTSDRcbX3fujMIh5X6akHieJBiSQ91AfghUNAoMRTPLO8SL2BJrp54JeCbh5omevmAQUIyhGUIyhHUI6gHEEo9y/zwBvu/mSNo8vtUQAAAABJRU5ErkJggg==", label: "Verde brillante" },
  mint: { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACcAAAAdCAYAAAApQnX+AAAAiklEQVR4nO2WsQ2AIBBFD3PLuAMFW+BmroBbULqBsdOOGWwwEEloveqH3GsI3csr4JvZuUxgHDGacrIPltDYFspFkNM9ERo+2CqIZ0ZELRim3PXgyjVUToqWk6LlhimXvjeuwP0FhXPd6+dvkFcJNAa5HOue+4nuOSm654b7vnpUToqWkwJXrp9wLxRJN2Lj58T9AAAAAElFTkSuQmCC", label: "Menta" },
  violet: { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAeCAYAAABaKIzgAAAAt0lEQVR42u3WsQkCMRSA4T+S8qq0ggd2Wthoa+sM4ghu4ARukiGcIdUV9gauEUmjHndVbAznCE94b4KPB8n7Dd/ZzA4ZgROiNwC2ILeLI92QJFpziN7YggR49w9xyvV8D5AtQDckkcjf5U0QPs/+/h/QMgpVqEIVKvAPBTDl1k/dSiS2TQ0hemMBXFXTpkYk1FX1uFGA3fIkMvMu1/OYeQDpdRP9mLRHtUe1R/WEKlShCtUeFdGjH057V/WsyikcAAAAAElFTkSuQmCC", label: "Violeta neón" },
  cyan: { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAeCAYAAABaKIzgAAAAt0lEQVR42u3WMQrCMBSA4T+SrYuTY0Hq6uRZxKmLi0cQdNaLZMphOnUWwUVIsHRxaJe4GOoRnvDeCT4eJO83fGexqxMCJ3hnAGxGro4HxthJtKbgnbEZCTCElzhlud8CJAswxk4k8nd5M4TP8Iz/Ac2jUIUqVKEC/1AAk2/9fLMWie2bluCdsQBFVdI3rUhoUZXTRgGWp7PIzLtfL1PmAbxvD9GPSXtUe1R7VE+oQhWqUO1RET36ATF9WL3C5mmGAAAAAElFTkSuQmCC", label: "Cian neón" },
  magenta: { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAeCAYAAABaKIzgAAAAuElEQVR42u3WIQ7CMBSA4b+kdgrJzBIEJBhOgsGREI4AHskBuETd7jI5HIYmS6BMIKgrhmYc4ZG8d4IvL2nfb/jOZrJOCBznawNgM/Kw2BFiL9GanK+NzUiAe3yKU26nK4BkAULsRSJ/lzdC+HTvx39A8yhUoQpVqMA/FMDkW78cz0Vim9DifG0sQFWUNKEVCa2KctgowHG2F5l5p8t5yDyA6+sm+jFpj2qPao/qCVWoQhWqPSqiRz9Ed1isaEHTFwAAAABJRU5ErkJggg==", label: "Magenta neón" },
  amber: { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAeCAYAAABaKIzgAAAAu0lEQVR42u3WsQkCMRSA4T+S6hoLi2u0CE5gaesCOoGNE9hbukZ2cIuUN8FhYaNIwHAg6BWx0KAjPOG9CT4eJO83fGYzH2UEjg/RANiC3C4dseslWrMP0diCBLimhzjlejEGyBYgdr1I5O/yBgif8+35H9AyClWoQhUq8A8FMOXWz6ZDkdimTfgQjQVwdUXTJpFQV1dAfG8UYL+aiMy83eH0zTyA4+Uu+jFpj2qPao/qCVWoQhWqPSqiR1/bEVkb/uO3LAAAAABJRU5ErkJggg==", label: "Ámbar atardecer" },
};

export const PIXEL_BUTTON_KEYS = Object.keys(PIXEL_BUTTONS);

// Set de iconos pixel-art seleccionables por tipo de entrada.
export const PIXEL_ICONS = {
  fire: { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAgCAYAAAB6kdqOAAAByElEQVR4nO2WsUoDQRCGNxfJGUJIDCemkHRXCCZXSEijRSoLK7GysfBNfBFbK0ktPoGIRVCwsEulGEQRMQkmkX9uZ7PsnaBkJc3+cGR3dm/mu38nyQnh5OTktFhlzMDF4da0ulGg8eP9B31+vo1FvpQVZhxzc8/u2U0i51/kmQEUKa9l1TxXyFIhFtYYLGz6aqzvsQoEvT6N1ZMz1M5RhWJY07V5HCgo7LMO9NIb0AVVZSHIrxcJSncJMS+ICMoGTCoQi4tXasuidVBSUDgmhro77YtJvyuGt+9q778AAQDFy1ov0eYgovhqbYkuCDBX52/CluKshlCglTL3610J1aV4KIR4uB5ac+dHICR/7n1RA3M/oXCoQeGo6AixJu8zHbVyZIDRE7dk/yRuDKK5i/8KiAV3wqZPzpiQabLhTioQEjOMXy+qGJqYv+Yit68aGsAMY/5GWQHSYbwgonECZtShHtJhbSk1ExefyKL59na8oMHAHTQ+w9hwJ9UhOKI3bB4wADFgcFTreyszWHmvdYe4bwDgBdIVSDsmQDTacRgxwOHvI36Qy7mAEq8K08HJVEHoGnVmY8Mtvb8yXmOu1w8nJycnsWB9A6lur3L8twDnAAAAAElFTkSuQmCC", label: "Fuego" },
  water: { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAgCAYAAAB6kdqOAAACMElEQVR4nO2VsUsbURzHf9dLjSDhLtVWCFQbAkExxaJT42AQWgjiYNtg20Gq0KEQEJyKQ/sfdIoEa6kibsnk4iC0k3Qu3QRROwRqaXsSkKYYUr6/+Hu95CKl3Ekd7gPhxz3eXT7v+3v3jsjHx8fn/6I1D/QPZmuowfCVhvHKj+8tHyDzQl0JCvRco/evUo5n/guX/vYn4aExms5mHIK4bpbxAsdqbqVe1CAhPH4Q41ouWbSWK6hxzNGjV0mLdtPP1Xc8Nj1/m54mr3ubEFZ78vlQXZdLFleRgUjX/SklA9YLGaoeWWquGwKOAVv0E8lOrosLy0oGIkBkwPauRdl8hnLPCt4LIZ3Jh/0Uipi84uLSByUTGEs0zJ3p02kkZrIQZII340RbHgsJKy83ueqGSeGeOCdT2/ui0hEZgJo3TKp82nFn02oPIR1JRTdMbqG9TbPpCL0Zr7cSyYBHd5fr84y6oKcJQQbRY7XVI4uC0QG1X+ypALQpdyqOVnvx6rc8h/BwSHXM3eNraZWkgWTyz7dUIhCX+9zScg8FRwccIjN9OicCCZa5cZrGfuM9VPRYqG0wTicHXynQW983s+kIV5GBiN4Z4rHqt7ISsR8DngoJkLqcSqizBTJtwzGW4N/+IbU/+XOiy/7qPQ8hpHO8sU2/Pu6ofYJkRAQgGbS0+Qhwi+O7k7zzmr/2dhFgFxFERuCENE07l5bhzdEN80yR5pP67WaJKO1GxcfHx4cuBL8B3ke75J+Rr/IAAAAASUVORK5CYII=", label: "Agua" },
  nature: { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAgCAYAAAB6kdqOAAACWklEQVR4nM3Wv07bUBQGcOcSSlEVQQlTjaeu3ZBggo2hT9FXYKrUhYGlEhMP0AWegO5MnUAREgMSCywEMzWQKq2SQFvQueqxjq/Puf+cSnxSFGxj3x/fvdhubGy9f0yMvFp4ob9/3d6X9uE2Hoe05lTiyuDHX/HYwebXBt1uxmJaBiRLZ0vb3XxYQdtgLCgGkxkQbj/i4DwXqjkpzNLhefI9/1MZYPThnf49X5Sqg0nfzGiIhIG83Dur4G3rTtVpprF/qr8lTAxKxWKWDs+9MKEoFTtNIRgbyoxy3WekaYrJYjqVjHbt56s6N73FdCoIc3E2Tn4OfttBrmZoYLrgoqFBDI00bcoXQ0MvbmsJjlGMq53KfYiGW8y9zyfFvuNvAysK91HM+MHj0RHSDKb3r1VAra63RFQoBsKuWq4dSP+uWjltyoWZmVbsw9f6tJcwkPnXTSeqTRrnMK6mlA8mvxnrT/vTcuITgEuYdHtFbKcEsjVjDkZb4AItShga7qmvbK8U+c04Oer09c8IxJZsKEADBD4AoRhbOxrE3Y1hcMB082Fl6iBvd1ZZFGwD5vpqVLQCWfmyVsFI70QlDbYjYVIyjRIKQzF4PZ80TQyeSDFHnX7lVg+DAOry43GBwnYAg61wGGyHvmmUQBImZ5qig8A+bArTNtAhGA2i77shmMxY/Bg8l/6BEoZ7SqhYTErWFl6jLkaDKEYa1AeD2yEYcQ1huAXNYcyBzTUYiykt6kljBuQ+I2HYNeSLsU1JLIadMheGxtw2/0PrYopFbcNkwpT8D4wGPScMgJ4A+/1gz5IS/zwAAAAASUVORK5CYII=", label: "Naturaleza" },
  sword: { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABZklEQVR4nGNgGGDASE/LtGR5/yPzrz3+zMhET8szEmMZ7PT1GY7ungIXZ6Kn5dfOXWJo70lFkWMaSMtp7gBcllu75oDjH8RmpKXloPgGAVyW08wBMMsv3nvAsG1dK07LQYCJppb3RuK1nOoOIMXnVHeAFhmWU80BsNQOAiiWp83AazlVHEBMVqOZA7QotJwiB1DDchBgpGUhQwxgoXU+JysKtGR5/6PX3ZRkNZIdAAKg+EV2BIbl969QbDkI4E2ER2dlwEMDJdhhlhORzwkBRkKpPNaSm8GreDlYDCXOqWA5XgegOwIZUMtyECBYDixfswnCUNRhWHz8K1Utx+sAWLzrKylAouD+FYbYKHNq2YvfAVpQy23F2MH44+ePYJ+DHAFq0WLLolRzgBaS5SDQuvsUOMhBmBaOYCTGcnQ1MDZVc4EWEZbTAjAhW96ebUlr+7A7AAa2rT5HV9+DAEoUwNj0snxQAAAmIQtQOdZ0rwAAAABJRU5ErkJggg==", label: "Espada" },
  gem: { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAdCAYAAADCdc79AAABn0lEQVR4nGPUdHD4zwAFS9LMGYyjOhkZ8ICzy8r/x8w6yUALALKfEWQBTICQY2AAWQ81AbH2j4JRMApGwSgYBYMZMNLKYAudEHgFfOLKGqLtYaKVYwQqJzJwyrsxCIW3oTiO7g6y0An5zzl9PgPTva8QC57cYQA5jlhHUdVBFjoh/5m3L2fgPPAcYvinF2Ca5dBFBpAjiXEUE7Udw7/gPpj//cQBBna3CIbv186A+dxLDhPlKCZqRhM/kmN+zUgERxenlgmKowilKUZqJWAmaJoBh0yUNziavj55AnGIjAzYUSDHgcA/GRWGdyursOY+FgYqgJ/LtsLTDKdbBAMTkmNAAMQGRcXXCzshAjCaVlHGaeEADgVQCPzctQJDHiT379dbBiY2YTBmENGmnYNOXFnDCAr+P3b6EMdB0wzIETDHgEIG7BCY/MNdOAtLqpXUFtCEDUq4IABLyLCQAQFQrsOVdqie7U9cWcP4PTMRJaRIdQxVHQQCIMs+tOeDcxEyADmOGMfQpOo4AU1TIEeBQucfnwTDm6PziK5gB11tDwCBXcTD+YpktgAAAABJRU5ErkJggg==", label: "Gema" },
};

export const PIXEL_ICON_KEYS = Object.keys(PIXEL_ICONS);

export const ELEMENT_COLOR_POOL = ["#e07a5f", "#7aa5d6", "#e9c46a", "#a3d977", "#81b29a", "#5089d3", "#c583d6", "#9b4d4d", "#45d3a3"];

// Misma idea que los elementos: listas de partida editables (agregar/quitar) para
// clasificar clases (rol) y objetos (tipo de arma / tipo de armadura), y así poder
// revisar de un vistazo si están bien distribuidas en el Catálogo.
export const CLASSIFICATION_COLOR_POOL = ELEMENT_COLOR_POOL;

// Piel de interfaz por mundo: cada proyecto puede tener su propia combinación
// de marco/botón/íconos pixel-art (o quedarse con la interfaz plana de siempre).
export const DEFAULT_SKIN = {
  uiSkin: "flat", // "flat" | "pixel"
  pixelFrame: "header",
  pixelButton: "teal",
  iconOverrides: {}, // { [categoryKey]: pixelIconKey }
  navOrder: ["dashboard", "brain", "relations", "templates", "catalogs"],
};

/* ---------- LIBRO DE CLASES (pestañas de clase/habilidad + hojas) ---------- */
export const BOOK_TAB_COLORS = ["#5089d3", "#c583d6", "#e9c46a", "#81b29a", "#e07a5f", "#9b4d4d", "#7c8aa3", "#45d3a3"];

/* ---------- THEME PANEL ---------- */
export const NAV_ITEM_META = {
  dashboard: { label: "Panel del mundo", icon: LayoutDashboard },
  generalBook: { label: "Gran Libro", icon: BookOpen },
  storyBook: { label: "Libro de historia", icon: Compass },
  handbook: { label: "Bitácora", icon: Brain },
  tools: { label: "Herramientas", icon: Wrench },
};

export const KIND_COLORS = { wiki: "#b8860b", pin: "#3a8a6e", event: "#7a4fb5", board: "#3a6ea5", boardlink: "#b04848" };
