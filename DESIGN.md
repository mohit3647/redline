---
name: Redline
description: Every risk, tied to the sentence it came from.
colors:
  field: "#1d2c86"
  field-deep: "#141f63"
  bond: "#fbfbf8"
  paper: "#eceef6"
  ink: "#0e1014"
  ink-soft: "#3b4056"
  on-field: "#fbfbf8"
  on-field-soft: "#cfd5f7"
  crit: "#ea4520"
  serious: "#f2c230"
  serious-line: "#a57600"
  kraft: "#bf9259"
  blank: "#dfe3fb"
  string: "#0a0f33"
  notice-string: "#a9b4f2"
  focus: "#f2c230"
  rule: "#cdd1e2"
typography:
  display:
    fontFamily: "Big Shoulders, Arial Narrow, sans-serif"
    fontSize: "clamp(3rem, 5.1vw, 5.6rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.005em"
  headline:
    fontFamily: "Big Shoulders, Arial Narrow, sans-serif"
    fontSize: "clamp(2.3rem, 3.9vw, 3.9rem)"
    fontWeight: 800
    lineHeight: 0.95
  title:
    fontFamily: "Big Shoulders, Arial Narrow, sans-serif"
    fontSize: "1.7rem"
    fontWeight: 800
    lineHeight: 1
  tag-number:
    fontFamily: "Big Shoulders, Arial Narrow, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.02em"
  stamp:
    fontFamily: "Big Shoulders Stencil, Big Shoulders, sans-serif"
    fontSize: "0.92rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.08em"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
    fontVariation: "'wdth' 100"
  tag-claim:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 650
    lineHeight: 1.35
  tag-range:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 400
    lineHeight: 1.4
    fontVariation: "'wdth' 92"
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 88"
  button:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.08rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.005em"
    fontVariation: "'wdth' 94"
  document:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.52
  document-title:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.28rem"
    fontWeight: 600
    lineHeight: 1.25
  quote:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.14rem"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  none: "0px"
  focus: "2px"
spacing:
  gutter: "clamp(16px, 4.5vw, 72px)"
  section: "clamp(72px, 11vw, 132px)"
  rail-gap: "22px"
  row: "44px"
  column-gap: "48px"
components:
  tag-critical:
    backgroundColor: "{colors.crit}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "14px 18px 14px 44px"
  tag-serious:
    backgroundColor: "{colors.serious}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "14px 18px 14px 44px"
  tag-cleared:
    backgroundColor: "{colors.kraft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "40px 20px 22px"
  tag-notice:
    backgroundColor: "{colors.bond}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "26px 30px 28px 56px"
  button-primary:
    backgroundColor: "{colors.blank}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "17px 28px 16px 50px"
  button-copy:
    backgroundColor: "{colors.field}"
    textColor: "{colors.bond}"
    rounded: "{rounded.none}"
    padding: "11px 16px 11px 30px"
  button-copy-hover:
    backgroundColor: "{colors.field-deep}"
  button-copy-done:
    backgroundColor: "{colors.ink}"
  chip-critical:
    backgroundColor: "{colors.crit}"
    textColor: "{colors.ink}"
    padding: "1px 5px 0 9px"
  chip-serious:
    backgroundColor: "{colors.serious}"
    textColor: "{colors.ink}"
    padding: "1px 5px 0 9px"
  chip-notice:
    backgroundColor: "{colors.field}"
    textColor: "{colors.bond}"
    padding: "1px 5px 0 9px"
  sheet:
    backgroundColor: "{colors.bond}"
    textColor: "{colors.ink}"
    typography: "{typography.document}"
    padding: "30px 60px 34px 40px"
  quote-block:
    backgroundColor: "{colors.bond}"
    textColor: "{colors.ink}"
    typography: "{typography.quote}"
    padding: "20px 24px"
---

# Design System: Redline

## Overview

**Creative North Star: "Tagged"**

A flag is a die-cut shipping tag tied by string to the exact sentence it came from. The world is a dispatch room laid over a contract. An ultramarine field holds a white bond sheet. Tags in saturated stock hang beside it on reinforced eyelets, and rubber stamps mark each one. The document stays calm and readable, while the tags do the shouting.

Pairing claim to source is the whole idea, and every surface has to show it. On wide screens a string runs from the sentence to its tag. On narrow screens a numbered chip beside the sentence does the same job, and the two elements stack. The category's usual split screen, a highlighted document screenshot beside a risk sidebar, was refused in the direction contract. The contract asked for a 5/7 column split. The build uses a fluid three-track grid instead (copy, sheet, tag rail), and the build is what this file records.

**Key Characteristics:**
- Ultramarine field, white bond document, saturated tag stock.
- Severity carried twice: stock colour and punch holes.
- Condensed industrial caps on tags and headings, with a serif used only for document text.
- Clipped corners, not rounded ones, on every tag-shaped control.
- One tying timeline on arrival, and nothing moves under reduced motion.

## Colors

This is a saturated industrial palette: one deep blue ground, one white document, and tag stocks that each stand for a single meaning.

### Primary
- **Ultramarine Field** (field): The page ground, the colour of the copy button and the notice chip, and the focus ring on light surfaces. It is also the stamp colour on white notice tags.
- **Deep Ultramarine** (field-deep): The hover state of field-blue buttons only.

### Secondary
- **Vermilion Stock** (crit): Critical tags, critical chips, critical strings, and the critical underline in the document. It never carries text on the field; ink sits on it (4.87:1).
- **Chrome Yellow Stock** (serious): Serious tags, chips, and strings, the emphasised word in the hero headline, and text selection. It carries ink text (11.37:1).
- **Tarnished Ochre** (serious-line): The serious underline on white bond only, because yellow alone disappears on white (3.9:1).
- **Focus Yellow** (focus): The focus ring on dark surfaces. It shares its value with serious, but it is a separate role.

### Tertiary
- **Kraft Stock** (kraft): Cleared tags only. It sits outside the severity scale.
- **Lavender Blank** (blank): Action tags (the primary call to action). A blank tag means "you do something here", never a finding.
- **Periwinkle String** (notice-string): The string colour for the confidentiality notice on the field (5.98:1). The build hard-codes this value rather than naming it as a property.

### Neutral
- **Bond White** (bond): The contract sheet, quote blocks, white notice stock, and grommets.
- **Cool Paper** (paper): Light section bands that hold ranked flags and scope.
- **Carbon Ink** (ink): Text on bond, paper, and every tag stock, and the ground of the dark section band.
- **Slate Ink** (ink-soft): Secondary text on light surfaces (8.83:1 on paper).
- **On-Field White / Soft Periwinkle** (on-field, on-field-soft): Primary and secondary text on field and ink bands.
- **Tie-String Navy** (string): The dark underlay beneath every string, grommet outlines, and cleared-tag hangers.
- **Rule Lilac** (rule): Hairline dividers between flag rows and scope items on paper.

### Named Rules
**The One Stock, One Meaning Rule.** Vermilion means Critical, yellow means Serious, kraft means cleared, white means the confidentiality exception, and lavender means an action. Never use a stock for decoration or for a different meaning.

**The Underline Carries the Tier Rule.** In the document, a flagged sentence gets a 3px underline in its tier colour, with no fill. The underline for Serious is ochre, not yellow. The notice underline is a dashed field-blue line (2px). A tinted fill appears only while the pair is lit.

## Typography

**Display Font:** Big Shoulders (with Arial Narrow)
**Stamp Font:** Big Shoulders Stencil (with Big Shoulders)
**Body Font:** Archivo, variable weight and width (with system-ui)
**Document Font:** Source Serif 4 (with Georgia)

**Character:** Condensed, warehouse-label caps for everything Redline says loudly, and a working grotesque for everything it explains. The serif belongs to the contract.

### Hierarchy
- **Display** (800, uppercase): Hero headline. The closing headline runs larger, at clamp(3.2rem, 8vw, 6rem) with a line height of 0.88.
- **Headline** (800, uppercase): Section headings.
- **Title** (800, uppercase): Sub-headings, with a 3px rule beneath. The limits line uses the same face at clamp(1.7rem, 2.6vw, 2.5rem).
- **Tag number** (800, uppercase): "No. 1" or "Clause 2" on a tag, and the digit on a chip (0.72rem).
- **Stamp** (Stencil 800, uppercase, 0.08em): Severity and status words ("Critical", "Serious", "Cleared", "Noted", "Absent", "Before upload", "Sample").
- **Body** (400): Running text, with a lede at 1.1rem. Keep measures to 40–58ch.
- **Tag claim** (650) above **Tag range** (400, width 92), separated by a hairline.
- **Label** (700, width 88, uppercase): Names a content block inside a flag ("From the agreement, clause 5", "Ask for instead"). It does not act as a section kicker.
- **Document / Document title / Quote** (Source Serif 4): The sheet, the parties line (italic), and verbatim quote blocks (max 62ch).

### Named Rules
**The Serif Is Evidence Rule.** Source Serif 4 is only for text that comes from the agreement: the sheet, quote blocks, and the quoted sentence on cleared tags. Redline's own words are always Archivo. This is how quotation and interpretation look different without relying on colour.

**The Caps Belong To Tags Rule.** Big Shoulders is always uppercase and always 800. The 700 weight is loaded but no role uses it yet.

## Layout

Bands run full width, with a gutter of clamp(16px, 4.5vw, 72px) and section padding of clamp(72px, 11vw, 132px). They alternate by meaning: field for the story, paper for evidence you read, ink for the disclosure. The hero is a three-track grid (minmax(300px, 1fr), minmax(400px, 540px), 252px, with a 48px gap). The sheet and the tag rail share a stage that the strings overlay. Ranked flags are rows with the tag on the left (300px) and the quote plus counter-offer on the right (gap 56px, padding 44px, rule hairlines). Cleared tags hang in four columns from a wire.

Responsive steps:
- **1180px:** The hero stacks copy above the stage, and cleared tags drop to two columns.
- **900px:** Flag rows stack, row strings hide, and the disclosure and scope grids go to one column.
- **859px:** The sheet and rail stack, and hero strings hide. The hero instead shows a peek: one sentence, a short fixed string, and its tag. The rail straightens.
- **560px:** Cleared tags go to one column, and the wire and hangers are removed.

**The Strings Need Room Rule.** Strings are drawn only where the pairing can be read: the hero at 860px and up, and ranked rows at 901px and up. Below those widths, numbered chips and the stacked order carry the pairing. Never draw a string that crosses content it can't clear.

## Elevation & Depth

Depth is physical. The sheet and the tags are objects lifted off the ground, while bands and text sit flat. All shadows are soft and ambient, and none is a hard offset.

### Shadow Vocabulary
- **Sheet lift** (`0 30px 60px -12px rgba(0,0,0,.55), 0 4px 10px rgba(0,0,0,.35)`): The contract sheet on the field.
- **Hanging tag, dark ground** (`filter: drop-shadow(0 10px 14px rgba(0,0,0,.38)) drop-shadow(0 2px 3px rgba(0,0,0,.3))`): Any tag on field or ink. A drop-shadow filter is used because the tag is clipped.
- **Hanging tag, light ground** (`filter: drop-shadow(0 8px 14px rgba(20,31,99,.22)) drop-shadow(0 1px 2px rgba(20,31,99,.25))`): Tags on paper.
- **Quote rest** (`0 1px 2px rgba(20,31,99,.12)`): Quote blocks on paper.
- **Peek slip** (`0 8px 18px rgba(0,0,0,.35)`): The single sentence in the narrow-screen peek.

**The Only Objects Lift Rule.** Only things that exist as paper (the sheet, tags, quote slips) get shadows. Buttons that are not tags, chips, and bands stay flat.

## Shapes

Tags are die-cut. On the eyelet side, the two corners are clipped at 45 degrees (22px on standard tags, 16px on the wordmark, 12px on the copy button, 5px on chips). A 5px hole is masked through the stock 17px from the eyelet edge, with a 20px reinforcement ring around it drawn as an inset shadow at a stock-specific darkness. Punch holes (4.5px) sit in the far corner. Stamps are bordered rectangles (2px currentColor) rotated -3 degrees, blended with multiply, and masked with fractal noise so the ink looks uneven. Round forms are reserved for hardware: eyelets, grommets, list dots, and "doesn't read" rings. The only radius is 2px, on focus outlines.

**The Clipped Not Rounded Rule.** Tag-shaped controls get clipped corners. The world's rounded forms are its metal and holes, so they are not banned. They just stay at hardware scale.

## Components

### Tag (signature component)
*A die-cut stock tag on an eyelet, with a number and a stamp above a claim.*
- **Anatomy:** A top row (tag number, then stamp), the claim, then an optional hairline and range line that begins "If used:". The claim states what the text does, and the range states the cost as a span. Voice rules live in PRODUCT.md.
- **Stocks and punch marks:** Critical is vermilion with two holes. Serious is yellow with one hole. Cleared is kraft with no holes, a top-centre eyelet, and chamfered top corners, hanging from a wire by a string. Notice is white bond with no holes and a field-blue stamp, reserved for the confidentiality exception. Blank is lavender with no holes and is used only for actions.
- **Mirrored:** In ranked rows, the eyelet, reinforcement patch, and clipped corners move to the right edge. Punch holes move to the bottom-left, and the tag rotates about its right eyelet.
- **Rest pose:** Rail tags hang at small alternating angles (-3 to 2.4 degrees). They straighten below 860px.
- **Lit:** When a sentence, chip, or tag is hovered or focused, its whole pair lights up. The rail tag slides 6px toward the sheet (0.35s), the string thickens from 1.8 to 3.2, and the sentence gets a tier-tinted fill.

### String
*The tie between a claim and its sentence.* An SVG curve: a 3.6px string-navy underlay at 55% opacity, with a 1.8px stroke in the tier colour on top and round caps. It starts at a bond grommet (r 5) placed at the sheet's right margin level with the sentence, or inside a quote block's top-left corner, and ends at the tag's eyelet. The sag is 16px plus 8% of the vertical drop. Notice strings use periwinkle over a heavier underlay (4px, 90%). Strings are hidden from assistive technology.

### Chips
*A small tag-shaped index number after a flagged sentence.* It uses the stock colour with ink text (a field chip gets bond text), a 5px pointed left end, and Big Shoulders 800 at 0.72rem. Each chip is a link to its flag and has an aria-label.

### Buttons
- **Primary (call to action):** A blank lavender tag. It rotates -2.5 degrees about its eyelet on hover (0.5s), settles to -1 degree plus 1px on press, and shows a 3px yellow ring offset 5px on focus.
- **Copy:** A field-blue arrow-ended button with bond text. It turns field-deep on hover, and ink while showing "Copied" (reverting after 2.2s). The focus ring is field-blue.

### Cards / Containers
- **Sheet:** A bond page with serif text, a stamped "Sample" header above a hairline, and numbered clauses. Any demonstration document carries the Sample stamp.
- **Quote block:** A bond slip on paper with no border, the quote rest shadow, and serif type at 1.14rem.

### Navigation
The wordmark is a small critical tag reading "REDLINE" (Big Shoulders 800, 1.6rem), with one hole and no punch marks. A single text link ("Sign in", Archivo 600) sits opposite it. A skip link is present.

### Motion

There is one arrival timeline. Tags swing (1.1s) and strings tighten from 4.2px to 1.8px while their grommets seat (0.9s). Each pair starts 0.42s after the one before it, beginning at 0.8s, all on `cubic-bezier(.16, 1, .3, 1)`. The resting state is fully visible before the timeline runs. It runs only at 860px and up, and the classes are removed after 3.2s. When a flag row is the URL target, its tag swings once. Under reduced motion, every swing, pull, seat, rotate, and slide transition is off. Colour and stroke-width changes still apply.

## Do's and Don'ts

### Do:
- **Do** mark severity with punch holes as well as stock: two for Critical, one for Serious.
- **Do** set every verbatim quotation in Source Serif 4 and every Redline sentence in Archivo.
- **Do** use a yellow focus ring (3px, offset 3px) on field and ink, and a field-blue ring on paper and bond.
- **Do** let focusing either end of a pair light both ends, so keyboard users see the tie.
- **Do** swap strings for numbered chips and a stacked layout below 860px (hero) and 901px (rows).
- **Do** stamp any demonstration document "Sample".

### Don't:
- **Don't** use a stock colour for anything other than its meaning, and don't set vermilion or kraft as text on the field (3.06:1 and 4.25:1). Yellow emphasis on the field is allowed.
- **Don't** use yellow for an underline on white. Use ochre (serious-line).
- **Don't** round the corners of tags or tag-shaped buttons.
- **Don't** put a shadow on anything that isn't paper.
- **Don't** set Big Shoulders in lowercase or below 800.
- **Don't** add a string that can't reach its sentence cleanly. Use a chip instead.
