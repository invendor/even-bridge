import { S } from "../state.js";
import { log, sanitizeG2Name, formatTime } from "../utils.js";

function getMessengerSelectText() {
  return S.availableMessengers.map((m, i) => {
    const name = m.charAt(0).toUpperCase() + m.slice(1);
    const prefix = i === S.messengerSelectIndex ? ">" : " ";
    return `${prefix} ${name}`;
  }).join("\n\n");
}

export async function showStartupScreen() {
  if (!S.bridge || !S.logoData) return;
  try {
    const imgX = Math.floor((576 - S.logoData.width) / 2);
    const textLabel = "Loading...";
    const textHeight = 30;
    const totalHeight = S.logoData.height + 10 + textHeight;
    const imgY = Math.floor((288 - totalHeight) / 2);
    const textY = imgY + S.logoData.height + 10;
    const rowWidth = textLabel.length * 9;
    const rowX = Math.floor((576 - rowWidth) / 2);

    S.bridge.createStartUpPageContainer({
      containerTotalNum: 3,
      textObject: [
        {
          containerID: 1,
          containerName: "evt",
          xPosition: 0,
          yPosition: 0,
          width: 576,
          height: 288,
          isEventCapture: 1,
          borderWidth: 0,
          borderColor: 0,
          borderRdaius: 0,
          paddingLength: 0,
          content: " ",
        },
        {
          containerID: 3,
          containerName: "label",
          xPosition: rowX,
          yPosition: textY,
          width: 350,
          height: 40,
          isEventCapture: 0,
          borderWidth: 0,
          borderColor: 0,
          borderRdaius: 0,
          paddingLength: 0,
          content: textLabel,
        },
      ],
      imageObject: [
        {
          containerID: 2,
          containerName: "logo",
          xPosition: imgX,
          yPosition: imgY,
          width: S.logoData.width,
          height: S.logoData.height,
        },
      ],
    });

    await S.bridge.updateImageRawData({
      containerID: 2,
      containerName: "logo",
      imageData: S.logoData.data,
    });

    S.startupShown = true;
    log("Startup loading screen displayed");
  } catch (e) {
    log("Startup screen error: " + e.message);
    S.bridge.createStartUpPageContainer({
      containerTotalNum: 1,
      textObject: [
        {
          containerID: 1,
          containerName: "main",
          xPosition: 0,
          yPosition: 0,
          width: 576,
          height: 288,
          isEventCapture: 1,
          borderWidth: 0,
          borderColor: 0,
          borderRdaius: 0,
          paddingLength: 16,
          content: "Loading...",
        },
      ],
    });
    S.startupShown = true;
  }
}

export async function showGlassesMessengerSelect() {
  if (!S.bridge || S.availableMessengers.length === 0) return;
  try {
    const charWidth = 9;
    const rowHeight = 40;
    const iconGap = 10;
    const iconSize = 24;
    const logoW = S.logoData?.width || 200;
    const logoH = S.logoData?.height || 72;
    const logoGap = 25;

    const longestName = S.availableMessengers.reduce((max, m) =>
      Math.max(max, m.length), 0);
    const textWidth = (2 + longestName) * charWidth;
    const totalRowWidth = textWidth + iconGap + iconSize;

    const listHeight = S.availableMessengers.length * rowHeight;
    const totalHeight = logoH + logoGap + listHeight;
    const logoY = Math.floor((288 - totalHeight) / 2);
    const selectY = logoY + logoH + logoGap;

    const logoX = Math.floor((576 - logoW) / 2);
    const textX = Math.floor((576 - totalRowWidth) / 2);
    const iconX = textX + textWidth + iconGap;
    const iconYOffset = Math.floor((rowHeight - iconSize) / 2);

    const imageObjects = [];
    const containerCount = 1 + (S.logoData ? 1 : 0) + S.availableMessengers.length;

    if (S.logoData) {
      imageObjects.push({
        containerID: 2,
        containerName: "logo",
        xPosition: logoX,
        yPosition: logoY,
        width: S.logoData.width,
        height: S.logoData.height,
      });
    }

    const iconYTweak = { telegram: -4, slack: 9 };
    S.availableMessengers.forEach((name, i) => {
      if (S.messengerIconData[name]) {
        const tweak = iconYTweak[name] || 0;
        imageObjects.push({
          containerID: 3 + i,
          containerName: `ic${i}`,
          xPosition: iconX,
          yPosition: selectY + i * rowHeight + iconYOffset + tweak,
          width: iconSize,
          height: iconSize,
        });
      }
    });

    const textContainerHeight = 288 - selectY;

    S.bridge.rebuildPageContainer({
      containerTotalNum: containerCount,
      textObject: [
        {
          containerID: 1,
          containerName: "select",
          xPosition: textX,
          yPosition: selectY,
          width: textWidth + 10,
          height: textContainerHeight,
          isEventCapture: 1,
          borderWidth: 0,
          borderColor: 0,
          borderRdaius: 0,
          paddingLength: 0,
          content: getMessengerSelectText(),
        },
      ],
      imageObject: imageObjects,
    });

    if (S.logoData) {
      await S.bridge.updateImageRawData({
        containerID: 2,
        containerName: "logo",
        imageData: S.logoData.data,
      });
    }
    for (let i = 0; i < S.availableMessengers.length; i++) {
      const name = S.availableMessengers[i];
      const icon = S.messengerIconData[name];
      if (icon) {
        await S.bridge.updateImageRawData({
          containerID: 3 + i,
          containerName: `ic${i}`,
          imageData: icon.data,
        });
      }
    }

    S.messengerSelectBuilt = true;
    log("Messenger selection displayed on glasses with icons");
  } catch (e) {
    log("Messenger select display error: " + e.message);
  }
}

export function updateGlassesMessengerSelection() {
  if (!S.bridge) return;
  try {
    S.bridge.textContainerUpgrade({
      containerID: 1,
      containerName: "select",
      content: getMessengerSelectText(),
    });
  } catch (e) {
    log("Selection update error: " + e.message);
  }
}

export function showGlassesContactList() {
  if (!S.bridge || S.contacts.length === 0) {
    log(`showGlassesContactList skipped: bridge=${!!S.bridge}, contacts=${S.contacts.length}`);
    return;
  }
  try {
    const hintHeight = 30;
    const names = S.contacts.slice(0, 15).map((c) => sanitizeG2Name(c.name));
    log(`G2 contact list: ${names.length} names, first="${names[0]}"`);
    const listPayload = {
      containerTotalNum: 2,
      listObject: [
        {
          containerID: 1,
          containerName: "contacts",
          xPosition: 0,
          yPosition: 0,
          width: 576,
          height: 288 - hintHeight,
          isEventCapture: 1,
          borderWidth: 1,
          borderColor: 13,
          borderRdaius: 6,
          paddingLength: 5,
          itemContainer: {
            itemCount: names.length,
            itemWidth: 560,
            isItemSelectBorderEn: 1,
            itemName: names,
          },
        },
      ],
      textObject: [
        {
          containerID: 2,
          containerName: "hint",
          xPosition: 0,
          yPosition: 288 - hintHeight,
          width: 576,
          height: hintHeight,
          isEventCapture: 0,
          borderWidth: 0,
          borderColor: 0,
          borderRdaius: 0,
          paddingLength: 2,
          content: "Double tap to go back",
        },
      ],
    };
    log(`Sending rebuildPageContainer with list (${JSON.stringify(names).slice(0, 100)})`);
    const result = S.bridge.rebuildPageContainer(listPayload);
    log(`rebuildPageContainer result: ${JSON.stringify(result)}`);
    log("Contact list displayed on glasses");
  } catch (e) {
    log("Contact list display error: " + (e?.message || e));
    log("Error stack: " + (e?.stack || "none"));
  }
}

export function rebuildGlassesDisplay(text, centered = false) {
  if (!S.bridge) return;
  try {
    if (!S.displayRebuilt) {
      const charWidth = 9;
      const lineHeight = 30;
      let cH, rowWidth, x, y, w;
      if (centered) {
        const lines = text.split("\n");
        const longestLine = lines.reduce((max, l) => Math.max(max, l.length), 0);
        rowWidth = longestLine * charWidth;
        cH = lines.length * lineHeight + 10;
        x = Math.floor((576 - Math.max(rowWidth, 200)) / 2);
        y = Math.floor((288 - cH) / 2);
        w = Math.max(rowWidth, 200);
      } else {
        cH = 288; rowWidth = 576; x = 0; y = 0; w = 576;
      }
      S.bridge.rebuildPageContainer({
        containerTotalNum: 1,
        textObject: [
          {
            containerID: 1,
            containerName: "main",
            xPosition: x,
            yPosition: y,
            width: w,
            height: cH,
            isEventCapture: 1,
            borderWidth: 0,
            borderColor: 0,
            borderRdaius: 0,
            paddingLength: centered ? 0 : 4,
            content: text,
          },
        ],
      });
      S.displayRebuilt = true;
    } else {
      S.bridge.textContainerUpgrade({
        containerID: 1,
        containerName: "main",
        content: text,
      });
    }
    log("Display updated: " + text.slice(0, 40));
  } catch (e) {
    log("Display error: " + e.message);
  }
}

export function showGlassesConversation(forceRebuild = false) {
  if (!S.bridge) return;
  try {
    const divider = String.fromCharCode(9472).repeat(28);
    let lines = [`To: ${S.selectedContact.name}`, divider];

    const msgs = [...S.conversationMessages].reverse();
    for (const m of msgs) {
      const sender = m.out ? "Me" : (m.senderName || S.selectedContact.name);
      const time = formatTime(m.date);
      const text = (m.text || "").slice(0, 80);
      lines.push(`${sender} (${time}): ${text}`);
    }

    if (msgs.length === 0) {
      lines.push("No messages yet");
    }

    lines.push(divider);
    lines.push("Double tap to record | Swipe to go back");

    if (forceRebuild) S.displayRebuilt = false;
    rebuildGlassesDisplay(lines.join("\n"));
    log("Conversation displayed on glasses");
  } catch (e) {
    log("Conversation display error: " + e.message);
  }
}

export function showGlassesPreview(text) {
  if (!S.bridge) return;
  try {
    const preview = text.length > 200 ? text.slice(0, 200) + "..." : text;
    const lines = [
      "Preview:",
      "",
      `"${preview}"`,
      "",
      "Tap to send | Swipe to cancel",
    ];
    S.displayRebuilt = false;
    rebuildGlassesDisplay(lines.join("\n"));
    log("Preview displayed on glasses");
  } catch (e) {
    log("Preview display error: " + e.message);
  }
}
