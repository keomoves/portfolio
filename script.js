import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import CustomEase from "gsap/CustomEase";

gsap.registerPlugin(CustomEase, SplitText);

const PROJECT_ORDER = [4, 1, 3, 2, 7, 6, 5];

const PROJECT_THUMBNAILS = {
  1: "/Proj1-4-thumbnail.png",
  2: "/Proj2.png",
  3: "/Proj3-2-thumbnail.png",
  4: "/Proj4-8-thumbnail.png",
  5: "/Proj5-1-thumbnail.jpg",
  6: "/Proj6-1-thumbnail.jpg",
  7: "/Proj7-1-thumbnail.jpg",
};

const PROJECT_GALLERY = {
  1: [
    "/Proj1-1.png",
    "/Proj1-2.png",
    "/Proj1-3.png",
    "/Proj1-4-thumbnail.png",
    "/Proj1-5.png",
    "/Proj1-6.png",
    "/Proj1-7.gif",
  ],
  2: ["/Proj2.png"],
  3: ["/Proj3-1.png", "/Proj3-2-thumbnail.png"],
  4: [
    "/Proj4-1.png",
    "/Proj4-2.png",
    "/Proj4-3.png",
    "/Proj4-4.png",
    "/Proj4-5.png",
    "/Proj4-6.png",
    "/Proj4-7.png",
    "/Proj4-8-thumbnail.png",
    "/Proj4-9.png",
    "/Proj4-10.gif",
  ],
  5: ["/Proj5-1-thumbnail.jpg", "/Proj5-2.gif"],
  6: ["/Proj6-1-thumbnail.jpg", "/Proj6-2.gif"],
  7: ["/Proj7-1-thumbnail.jpg", "/Proj7-2.gif"],
};

const getProjectId = (clientIndex) => PROJECT_ORDER[clientIndex] ?? PROJECT_ORDER[0];

const clientPreviewImageSrc = (clientIndex) => {
  const projectId = getProjectId(clientIndex);
  return PROJECT_THUMBNAILS[projectId] ?? `/Proj${projectId}.png`;
};

let projectRevealTl = null;

function getProjectFromUrl() {
  const raw = new URLSearchParams(window.location.search).get("project");
  if (raw === null || raw === "") return null;
  const i = parseInt(raw, 10);
  return Number.isNaN(i) ? null : i;
}

function isAboutFromUrl() {
  return new URLSearchParams(window.location.search).get("about") === "1";
}

function setUrlForProject(clientIndex) {
  const url = new URL(window.location.href);
  url.searchParams.delete("about");
  url.searchParams.set("project", String(clientIndex));
  history.pushState({ project: clientIndex }, "", url);
}

function setUrlForAbout() {
  const url = new URL(window.location.href);
  url.searchParams.delete("project");
  url.searchParams.set("about", "1");
  history.pushState({ about: true }, "", url);
}

function setUrlForHome() {
  const url = new URL(window.location.href);
  url.searchParams.delete("project");
  url.searchParams.delete("about");
  history.pushState({ home: true }, "", url);
}

function resetProjectDetailForReveal(root) {
  if (!root) return;
  const q = gsap.utils.selector(root);
  if (projectRevealTl) {
    projectRevealTl.kill();
    projectRevealTl = null;
  }
  const targets = [
    q(".project-detail__title"),
    ...q(".project-detail__grid-item"),
  ].filter(Boolean);
  gsap.killTweensOf(targets);
  gsap.set(q(".project-detail__title"), {
    opacity: 0,
    y: 16,
  });
  gsap.set(q(".project-detail__grid-item"), {
    opacity: 0,
    y: 24,
  });
}

function playProjectDetailReveal(root) {
  if (!root) return;
  const q = gsap.utils.selector(root);
  resetProjectDetailForReveal(root);

  const tl = gsap.timeline();
  projectRevealTl = tl;

  tl.to(q(".project-detail__title"), {
    y: 0,
    opacity: 1,
    duration: 0.45,
    ease: "power3.out",
  }).to(
    q(".project-detail__grid-item"),
    {
      y: 0,
      opacity: 1,
      duration: 0.55,
      stagger: 0.04,
      ease: "power2.out",
    },
    "-=0.15"
  );
}

function openProjectDetail(clientIndex, { push = true } = {}) {
  const root = document.getElementById("project-detail");
  if (!root) return;
  closeAboutDetailFromHistory();

  const clientEl = document.querySelector(
    `.site-main .client-name[data-client-index="${clientIndex}"]`
  );
  const rawTitle =
    clientEl?.querySelector("h1")?.textContent?.replace(/\s*,\s*$/, "") ??
    "Projet";

  const titleEl = root.querySelector(".project-detail__title");
  const gridEl = root.querySelector(".project-detail__grid");
  const projectId = getProjectId(clientIndex);
  const gallery = PROJECT_GALLERY[projectId] ?? [clientPreviewImageSrc(clientIndex)];

  if (titleEl) titleEl.textContent = rawTitle;
  if (gridEl) {
    gridEl.innerHTML = gallery
      .map(
        (src, i) =>
          `<figure class="project-detail__grid-item" role="listitem"><img src="${src}" alt="${rawTitle} image ${i + 1}" loading="lazy" /></figure>`
      )
      .join("");
  }

  resetProjectDetailForReveal(root);

  root.removeAttribute("hidden");
  root.setAttribute("aria-hidden", "false");

  if (push) setUrlForProject(clientIndex);

  requestAnimationFrame(() => {
    playProjectDetailReveal(root);
  });
}

function closeProjectDetailFromHistory() {
  const root = document.getElementById("project-detail");
  if (!root) return;
  resetProjectDetailForReveal(root);
  root.setAttribute("hidden", "");
  root.setAttribute("aria-hidden", "true");
}

function openAboutDetail({ push = true } = {}) {
  const root = document.getElementById("about-detail");
  if (!root) return;
  closeProjectDetailFromHistory();
  root.removeAttribute("hidden");
  root.setAttribute("aria-hidden", "false");
  if (push) setUrlForAbout();
}

function closeAboutDetailFromHistory() {
  const root = document.getElementById("about-detail");
  if (!root) return;
  root.setAttribute("hidden", "");
  root.setAttribute("aria-hidden", "true");
}

function initLacrapuleClientsHover(onPickClient) {
  CustomEase.create(
    "hopClient",
    "M0,0 C0.071,0.505 0.192,0.726 0.318,0.852 0.45,0.984 0.504,1 1,1"
  );

  const root = document.querySelector(".site-main");
  if (!root) return;

  const clientsPreview = root.querySelector(".clients-preview");
  const clientNames = root.querySelectorAll(".client-name");

  if (!clientsPreview || !clientNames.length) return;

  let activeClientIndex = -1;

  clientNames.forEach((client, index) => {
    let activeClientImgWrapper = null;
    let activeClientImg = null;

    client.addEventListener("click", (e) => {
      e.preventDefault();
      onPickClient(index);
    });

    client.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onPickClient(index);
      }
    });

    client.addEventListener("mouseover", () => {
      if (activeClientIndex === index) return;

      if (activeClientIndex !== -1) {
        const previousClient = clientNames[activeClientIndex];
        previousClient.dispatchEvent(new Event("mouseout"));
      }

      activeClientIndex = index;

      const clientImgWrapper = document.createElement("div");
      clientImgWrapper.className = "client-img-wrapper";

      const clientImg = document.createElement("img");
      clientImg.src = clientPreviewImageSrc(index);
      gsap.set(clientImg, { scale: 1.25, opacity: 0 });

      clientImgWrapper.appendChild(clientImg);
      clientsPreview.appendChild(clientImgWrapper);

      activeClientImgWrapper = clientImgWrapper;
      activeClientImg = clientImg;

      gsap.to(clientImgWrapper, {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        duration: 0.5,
        ease: "hopClient",
      });

      gsap.to(clientImg, {
        opacity: 1,
        duration: 0.25,
        ease: "power2.out",
      });

      gsap.to(clientImg, {
        scale: 1,
        duration: 1.25,
        ease: "hopClient",
      });
    });

    client.addEventListener("mouseout", (event) => {
      if (event.relatedTarget && client.contains(event.relatedTarget)) {
        return;
      }

      if (activeClientIndex === index) {
        activeClientIndex = -1;
      }

      if (activeClientImg && activeClientImgWrapper) {
        const clientImgToRemove = activeClientImg;
        const clientImgWrapperToRemove = activeClientImgWrapper;

        activeClientImg = null;
        activeClientImgWrapper = null;

        gsap.to(clientImgToRemove, {
          opacity: 0,
          duration: 0.5,
          ease: "power1.out",
          onComplete: () => {
            clientImgWrapperToRemove.remove();
          },
        });
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  CustomEase.create("hop", "0.9, 0, 0.1, 1");

  const createSplit = (selector, type, className) => {
    return SplitText.create(selector, {
      type: type,
      [type + "Class"]: className,
      mask: type,
    });
  };

  const splitPreloaderHeader = createSplit(
    ".preloader-header a",
    "chars",
    "char"
  );
  const splitPreloaderCopy = createSplit(".preloader-copy p", "lines", "line");

  const chars = splitPreloaderHeader.chars;
  const lines = splitPreloaderCopy.lines;
  const initialChar = chars[0];
  const endCharIndex = chars.findIndex(
    (c) => c.textContent === "C" || c.textContent === "c"
  );
  const endChar =
    endCharIndex >= 0 ? chars[endCharIndex] : chars[chars.length - 1];

  chars.forEach((char, index) => {
    gsap.set(char, { yPercent: index % 2 === 0 ? -100 : 100 });
  });

  gsap.set(lines, { yPercent: 100 });

  const preloaderImages = gsap.utils.toArray(".preloader-images .img");
  const preloaderImagesInner = gsap.utils.toArray(".preloader-images .img img");

  const tl = gsap.timeline({ delay: 0.25 });

  tl.to(".progress-bar", {
    scaleX: 1,
    duration: 4,
    ease: "power3.inOut",
  })
    .set(".progress-bar", { transformOrigin: "right" })
    .to(".progress-bar", {
      scaleX: 0,
      duration: 1,
      ease: "power3.in",
    });

  preloaderImages.forEach((preloaderImg, index) => {
    tl.to(
      preloaderImg,
      {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        duration: 1,
        ease: "hop",
        delay: index * 0.75,
      },
      "-=5"
    );
  });

  preloaderImagesInner.forEach((preloaderImageInner, index) => {
    tl.to(
      preloaderImageInner,
      {
        scale: 1,
        duration: 1.5,
        ease: "hop",
        delay: index * 0.75,
      },
      "-=5.25"
    );
  });

  tl.to(
    lines,
    {
      yPercent: 0,
      duration: 2,
      ease: "hop",
      stagger: 0.1,
    },
    "-=5.5"
  );

  tl.to(
    chars,
    {
      yPercent: 0,
      duration: 1,
      ease: "hop",
      stagger: 0.025,
    },
    "-=5"
  );

  tl.to(
    ".preloader-images",
    {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      duration: 1,
      ease: "hop",
    },
    "-=1.5"
  );

  tl.to(
    lines,
    {
      y: "-125%",
      duration: 2,
      ease: "hop",
      stagger: 0.1,
    },
    "-=2"
  );

  tl.to(
    chars,
    {
      yPercent: (index) => {
        if (index === 0 || index === endCharIndex) {
          return 0;
        }
        return index % 2 === 0 ? 100 : -100;
      },
      duration: 1,
      ease: "hop",
      stagger: 0.025,
      delay: 0.5,
      onStart: () => {
        const initialCharMask = initialChar.parentElement;
        const endCharMask = endChar.parentElement;

        if (
          initialCharMask &&
          initialCharMask.classList.contains("char-mask")
        ) {
          initialCharMask.style.overflow = "visible";
        }

        if (endCharMask && endCharMask.classList.contains("char-mask")) {
          endCharMask.style.overflow = "visible";
        }

        const viewportWidth = window.innerWidth;
        const centerX = viewportWidth / 2;
        const initialCharRect = initialChar.getBoundingClientRect();
        const endCharRect = endChar.getBoundingClientRect();
        const kcGap = 6;

        gsap.to([initialChar, endChar], {
          duration: 1,
          ease: "hop",
          delay: 0.5,
          x: (i) => {
            if (i === 0) {
              const targetRightEdge = centerX - kcGap / 2;
              return (
                targetRightEdge -
                (initialCharRect.left + initialCharRect.width)
              );
            }
            const targetLeftEdge = centerX + kcGap / 2;
            return targetLeftEdge - endCharRect.left;
          },
          onComplete: () => {
            gsap.set(".preloader-header", { mixBlendMode: "difference" });
            gsap.to(".preloader-header", {
              y: "2rem",
              scale: 0.35,
              duration: 1.75,
              ease: "hop",
            });
          },
        });
      },
    },
    "-=2.5"
  );

  tl.to(
    ".preloader",
    {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      duration: 1.75,
      ease: "hop",
      onComplete: () => {
        document.body.classList.add("preloader-done");
        if (isAboutFromUrl()) {
          openAboutDetail({ push: false });
          return;
        }
        const idx = getProjectFromUrl();
        if (idx !== null) openProjectDetail(idx, { push: false });
      },
    },
    "-=0.5"
  );
});

window.addEventListener("popstate", () => {
  const idx = getProjectFromUrl();
  if (isAboutFromUrl()) {
    openAboutDetail({ push: false });
  } else if (idx === null) {
    closeProjectDetailFromHistory();
    closeAboutDetailFromHistory();
  } else {
    closeAboutDetailFromHistory();
    openProjectDetail(idx, { push: false });
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const projectRoot = document.getElementById("project-detail");
  const aboutRoot = document.getElementById("about-detail");
  const projectOpen = projectRoot && !projectRoot.hasAttribute("hidden");
  const aboutOpen = aboutRoot && !aboutRoot.hasAttribute("hidden");
  if (!projectOpen && !aboutOpen) return;
  if (getProjectFromUrl() !== null || isAboutFromUrl()) history.back();
});

document.querySelector(".project-detail__back")?.addEventListener("click", () => {
  if (getProjectFromUrl() !== null) {
    history.back();
  } else {
    closeProjectDetailFromHistory();
  }
});

document.querySelector(".about-detail__back")?.addEventListener("click", () => {
  if (isAboutFromUrl()) {
    history.back();
  } else {
    closeAboutDetailFromHistory();
    setUrlForHome();
  }
});

document.querySelector("#about-link")?.addEventListener("click", (e) => {
  e.preventDefault();
  openAboutDetail();
});

const closeToHome = (e) => {
  e.preventDefault();
  closeProjectDetailFromHistory();
  closeAboutDetailFromHistory();
  setUrlForHome();
};

document.querySelector("#home-link")?.addEventListener("click", closeToHome);
document.querySelector("#home-link-nav")?.addEventListener("click", closeToHome);

initLacrapuleClientsHover((index) => {
  openProjectDetail(index);
});
