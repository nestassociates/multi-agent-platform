# Feature Specification: Property Detail Page

**Feature Branch**: `010-property-detail-page`
**Created**: 2025-12-23
**Status**: Draft
**Input**: Property Detail Page - A comprehensive property detail page template for the main-site that displays full property information including: image gallery carousel with thumbnail sync, SOLD badge overlay, property stats grid, dynamic agent card, expandable description, property details grid, collapsible accordions (floor plan, utilities, EPC), greyscale map with custom marker, viewing request form, agent's other properties carousel, agent reviews carousel. Must have responsive mobile/tablet/desktop layouts.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Property Details (Priority: P1)

A prospective buyer or renter visits a property detail page to view comprehensive information about a specific property, including photos, price, features, and location.

**Why this priority**: This is the core purpose of the page - without the ability to view property details, the page serves no function. This enables users to make informed decisions about properties.

**Independent Test**: Can be fully tested by navigating to any property URL and verifying all property information displays correctly across all screen sizes.

**Acceptance Scenarios**:

1. **Given** a user on the property archive page, **When** they click on a property card, **Then** they are taken to the property detail page showing all property information
2. **Given** a user on the property detail page, **When** the page loads, **Then** they see the main image, price, location, property stats (type, beds, baths, size, tenure), key features, and full description
3. **Given** a property with "sold" status, **When** the detail page loads, **Then** a SOLD badge is displayed overlaying the main image
4. **Given** a property with "available" status, **When** the detail page loads, **Then** no status badge is displayed on the image

---

### User Story 2 - Browse Property Images (Priority: P1)

A user wants to view all available property images in detail using the image gallery with carousel navigation and thumbnail sync.

**Why this priority**: High-quality imagery is critical for property decisions. Users need to see multiple angles and rooms before considering a viewing.

**Independent Test**: Can be tested by interacting with the image gallery carousel and verifying all images display and sync correctly.

**Acceptance Scenarios**:

1. **Given** a property with multiple images, **When** the page loads, **Then** the main image displays with navigation arrows and 3 thumbnail images stacked on the right (desktop)
2. **Given** the user clicks a thumbnail image, **When** clicked, **Then** the main carousel advances to show that image and all thumbnails update to reflect current position
3. **Given** the user clicks the carousel navigation arrows, **When** clicked, **Then** the main image and thumbnails all advance/retreat together in sync
4. **Given** a mobile viewport, **When** the page loads, **Then** the gallery displays in a mobile-optimized layout with swipe navigation

---

### User Story 3 - Contact Agent for Viewing (Priority: P1)

A user interested in the property wants to request a viewing by completing a contact form.

**Why this priority**: Converting interest into viewings is the primary business goal. Without this, the page cannot generate leads.

**Independent Test**: Can be tested by completing and submitting the viewing request form and verifying submission success.

**Acceptance Scenarios**:

1. **Given** a user on the property detail page, **When** they scroll to the viewing request form, **Then** they see fields for first name, surname, email, contact number, and dropdown options for "I have a property to sell" and "I have a property to let"
2. **Given** a user has filled in all required fields, **When** they click "REQUEST VIEWING", **Then** the form is submitted and the user receives confirmation
3. **Given** a user submits incomplete or invalid data, **When** they click submit, **Then** appropriate validation errors are displayed
4. **Given** a user clicks the pink "REQUEST VIEWING" button in the CTA section (below property stats), **When** clicked, **Then** the page scrolls smoothly to the viewing request form

---

### User Story 4 - View Agent Information (Priority: P2)

A user wants to see who the listing agent is and contact them directly.

**Why this priority**: Building trust with the agent is important for conversions, but secondary to viewing the property itself.

**Independent Test**: Can be tested by verifying agent information displays correctly and contact actions work.

**Acceptance Scenarios**:

1. **Given** a property detail page, **When** the page loads, **Then** the agent card displays the agent's name, phone number, placeholder headshot image, and social media icons
2. **Given** the agent card is visible, **When** the user clicks the phone number, **Then** the phone dialer is triggered (tel: link)
3. **Given** the agent card has social icons, **When** the user clicks Instagram icon, **Then** it opens the agent's Instagram profile in a new tab

---

### User Story 5 - View Property Specifications (Priority: P2)

A user wants to view detailed property specifications including floor plan, utilities/rights/restrictions, and energy performance certificate.

**Why this priority**: Detailed specifications help serious buyers make informed decisions but are secondary to initial viewing interest.

**Independent Test**: Can be tested by expanding each accordion section and verifying content displays correctly.

**Acceptance Scenarios**:

1. **Given** a property detail page, **When** the page loads, **Then** all three accordion sections (Floor Plan, Utilities/Rights & Restrictions, Energy Performance Certificate) are collapsed by default
2. **Given** a collapsed accordion section, **When** the user clicks on it, **Then** the section expands to reveal its content and the chevron rotates
3. **Given** the Floor Plan accordion is expanded, **When** viewed, **Then** the floor plan image(s) are displayed
4. **Given** the Utilities accordion is expanded, **When** viewed, **Then** a two-column list of utility information is displayed (electricity, water, sewerage, heating, broadband, mobile coverage)
5. **Given** the EPC accordion is expanded, **When** viewed, **Then** the Energy Efficiency Rating chart and Environmental CO2 Impact Rating chart are displayed with current and potential ratings

---

### User Story 6 - View Property Location on Map (Priority: P2)

A user wants to see where the property is located on a map.

**Why this priority**: Location is crucial for property decisions but static map viewing is less interactive than other features.

**Independent Test**: Can be tested by verifying the map loads with correct property location marker.

**Acceptance Scenarios**:

1. **Given** a property with location coordinates, **When** the page loads, **Then** a greyscale-styled map displays with a custom marker at the property location
2. **Given** the map is displayed, **When** the user interacts with it, **Then** they can zoom and pan to explore the surrounding area
3. **Given** a property without location coordinates, **When** the page loads, **Then** the map section is hidden or displays an appropriate message

---

### User Story 7 - Browse Agent's Other Properties (Priority: P2)

A user interested in the agent wants to see other properties they have listed.

**Why this priority**: Cross-selling increases engagement and provides value, but is secondary to the current property focus.

**Independent Test**: Can be tested by verifying the carousel shows other properties from the same agent with working navigation.

**Acceptance Scenarios**:

1. **Given** an agent with multiple properties, **When** the property detail page loads, **Then** a carousel section titled "[Agent's First Name]'S OTHER PROPERTIES" displays
2. **Given** the agent carousel is visible, **When** the user clicks navigation arrows, **Then** the carousel scrolls to show additional properties
3. **Given** the user clicks on a property in the carousel, **When** clicked, **Then** they are taken to that property's detail page
4. **Given** an agent with only one property (the current one), **When** the page loads, **Then** the "Other Properties" section is hidden

---

### User Story 8 - Read Agent Reviews (Priority: P3)

A user wants to read reviews about the listing agent to build trust.

**Why this priority**: Reviews build trust but are supplementary to the property information itself.

**Independent Test**: Can be tested by verifying reviews carousel displays agent's reviews correctly.

**Acceptance Scenarios**:

1. **Given** an agent with reviews, **When** the property detail page loads, **Then** a reviews carousel displays showing the agent's reviews with star ratings
2. **Given** the reviews carousel is visible, **When** the user navigates through reviews, **Then** they can see multiple reviews
3. **Given** an agent with no reviews, **When** the page loads, **Then** the reviews section is hidden or displays an appropriate message

---

### User Story 9 - Share Property (Priority: P3)

A user wants to share the property listing with others via social media or direct link.

**Why this priority**: Sharing extends reach but is a supplementary feature after viewing.

**Independent Test**: Can be tested by clicking share icon and verifying dropdown options work.

**Acceptance Scenarios**:

1. **Given** a property detail page, **When** the user clicks the share icon, **Then** a dropdown menu appears with sharing options
2. **Given** the share dropdown is open, **When** the user selects "Copy Link", **Then** the property URL is copied to clipboard with confirmation
3. **Given** the share dropdown is open, **When** the user selects a social platform, **Then** a new window opens with the share dialog for that platform pre-filled

---

### User Story 10 - View Video Tour (Priority: P3)

A user wants to watch a video tour of the property.

**Why this priority**: Video tours enhance the experience but not all properties have them, making this a bonus feature.

**Independent Test**: Can be tested by clicking video tour icon and verifying external link opens.

**Acceptance Scenarios**:

1. **Given** a property with a video tour URL, **When** the user clicks the video icon, **Then** the video URL opens in a new browser tab (Instagram)
2. **Given** a property without a video tour URL, **When** the page loads, **Then** the video icon is hidden

---

### Edge Cases

- What happens when a property has no images? Display a placeholder image
- What happens when a property has only 1-2 images? Thumbnail grid adapts to show available images only, carousel arrows hidden if only one image
- What happens when property data is missing (no EPC, no floor plan)? Respective accordion sections are hidden
- How does the page handle very long property descriptions? Text is truncated with "Read More" toggle
- What happens if the agent has no other properties? "Other Properties" section is hidden
- What happens if the property has no location coordinates? Map section is hidden
- What happens on slow connections? Skeleton loaders display while content loads

## Requirements *(mandatory)*

### Functional Requirements

**Image Gallery**
- **FR-001**: System MUST display a main image carousel with left/right navigation arrows
- **FR-002**: System MUST display 3 stacked thumbnail images on the right side (desktop layout)
- **FR-003**: System MUST synchronize all images when navigating - clicking a thumbnail or using arrows updates both main image and thumbnail selection
- **FR-004**: System MUST display a SOLD badge overlay on the main image when property status is "sold" or "let agreed"
- **FR-005**: System MUST adapt to mobile layout with swipe-enabled carousel

**Property Information**
- **FR-006**: System MUST display property price and location prominently below the gallery
- **FR-007**: System MUST display property stats in a 5-column grid: Property Type, Bedrooms, Bathrooms, Size, Tenure (with icons)
- **FR-008**: System MUST display key features as a two-column bulleted list
- **FR-009**: System MUST display property description with expandable "Read More/Read Less" toggle
- **FR-010**: System MUST display property details in a 4-column grid: Council Tax Band, Parking, Garden, Accessibility

**Agent Information**
- **FR-011**: System MUST display agent card with name, phone number, and social media links dynamically based on the property's assigned agent
- **FR-012**: System MUST display agent headshot (placeholder if not available)
- **FR-013**: System MUST link agent phone number to tel: protocol

**Interactive Elements**
- **FR-014**: System MUST display video tour icon that opens external URL in new tab (when video URL exists)
- **FR-015**: System MUST display share icon with dropdown menu for sharing options (copy link, social platforms)
- **FR-016**: System MUST provide three collapsible accordion sections: Floor Plan, Utilities/Rights & Restrictions, Energy Performance Certificate
- **FR-017**: System MUST display all accordion sections collapsed by default
- **FR-018**: System MUST display greyscale-styled interactive map with custom marker showing property location

**Forms**
- **FR-019**: System MUST provide viewing request form with fields: First Name, Surname, Email, Contact Number
- **FR-020**: System MUST provide dropdown options: "I have a property to sell", "I have a property to let"
- **FR-021**: System MUST validate form fields before submission
- **FR-022**: Pink "REQUEST VIEWING" button in CTA section MUST scroll to the viewing request form

**Related Content**
- **FR-023**: System MUST display carousel of agent's other property listings (excluding current property)
- **FR-024**: System MUST display section title as "[Agent First Name]'S OTHER PROPERTIES"
- **FR-025**: System MUST display agent's reviews in a carousel format
- **FR-026**: System MUST hide related content sections when no data is available

**Responsive Design**
- **FR-027**: System MUST provide optimized layouts for mobile, tablet, and desktop viewports
- **FR-028**: System MUST ensure all interactive elements are touch-friendly on mobile devices
- **FR-029**: Grid layouts MUST collapse to appropriate column counts on smaller screens

### Key Entities

- **Property**: The main entity containing all property data (images, price, location, features, description, status, specifications, coordinates)
- **Agent**: The listing agent associated with the property (name, phone, email, social links, headshot URL)
- **Property Images**: Collection of image URLs for the property gallery
- **Floor Plan**: Image(s) of the property floor plan
- **EPC Data**: Energy Performance Certificate ratings (current and potential for both efficiency and environmental impact)
- **Utilities Data**: Property utility information (electricity, water, heating, broadband, mobile coverage)
- **Reviews**: Agent's reviews from clients (rating, text, reviewer name)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view all property information on the detail page within 3 seconds of page load
- **SC-002**: Users can navigate through all property images using carousel controls with immediate visual feedback
- **SC-003**: Viewing request form can be completed and submitted in under 60 seconds
- **SC-004**: Page maintains usability and readability across all device sizes (mobile, tablet, desktop)
- **SC-005**: All interactive elements (accordions, carousels, forms) respond to user input within 200ms
- **SC-006**: Users can successfully share property via at least 3 methods (copy link, 2+ social platforms)
- **SC-007**: Page displays correctly with partial data (missing images, no video, no reviews, etc.)
- **SC-008**: Agent contact information is accessible within one click from any viewport
- **SC-009**: 100% of properties with coordinates display accurate map location
- **SC-010**: Cross-navigation to agent's other properties works from every property detail page

## Assumptions

- Property data is available via existing dashboard API
- Agent data is included in property API response or available via separate endpoint
- Reviews are associated with agents and retrievable via API
- Map service (Mapbox) is already configured in the project
- SVG assets (SOLD badge, map marker) will be provided separately
- Placeholder icons will be used initially for property stats and accordions
- Video tour URLs point to external platforms (Instagram)
- Form submissions will use existing contact form infrastructure or new endpoint

## Out of Scope

- Property comparison functionality
- Save/favorite properties feature
- Mortgage calculator or financial tools
- Virtual tour/3D walkthrough integration
- Print-friendly version
- Property alerts/notifications
- Booking specific viewing times (form is general inquiry)
