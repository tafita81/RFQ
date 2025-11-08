# Leads Dashboard - TODO

## Current Goal: Portal Mapping

**Objective:** Map which portal/website each of the 900 companies uses to publish RFQs/procurement opportunities for the 3 focus areas (PFAS/EPR, BuyAmerica, EUDR)

## Phase 1: Schema & Infrastructure

- [x] Create database schema for companies
- [x] Import 900 companies to database
- [x] Create opportunities schema
- [x] Setup tRPC API endpoints

## Phase 2: Portal Discovery (Current)

- [x] Create portal mapping table/fields
- [x] Develop scraper to find vendor portals, supplier portals, RFQ pages
- [x] Identify procurement portal URLs for each company
- [x] Extract portal login URLs, registration links
- [x] Map portal types (public, login-required, third-party)
- [x] Categorize by focus area (PFAS/EPR, BuyAmerica, EUDR)

## Phase 3: Dashboard & Visualization

- [x] Create table view showing company → portal mapping
- [x] Add filters by focus area
- [x] Show portal accessibility (public vs login-required)
- [x] Display portal URLs with direct links
- [x] Export portal mapping to CSV

## Phase 4: Execution

- [ ] Run portal mapping scraper on all 900 companies
- [ ] Validate portal URLs are accessible
- [ ] Document portal access requirements
- [ ] Create user guide for accessing portals
