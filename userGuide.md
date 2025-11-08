# Leads Dashboard - User Guide

## Purpose
View and manage business leads collected from 900+ companies worldwide through automated web scraping.

## Access
Public access - no login required for viewing leads data.

## Powered by Manus

This application is built with cutting-edge web technologies for maximum performance and reliability. The frontend uses **React 19** with **TypeScript** for type-safe development and **Tailwind CSS 4** for modern, responsive design. The backend leverages **Express 4** with **tRPC 11** for end-to-end type safety and seamless API integration. Data persistence is handled by **MySQL** with **Drizzle ORM** for efficient database operations. User authentication is powered by **Manus OAuth** for secure access control. The entire stack is deployed on **auto-scaling infrastructure with global CDN** for fast, reliable access worldwide.

## Using Your Website

The dashboard provides comprehensive lead management with powerful filtering and export capabilities. Start by clicking **"View Leads Dashboard"** on the home page to access the main interface. You'll see statistics cards showing total leads, leads with emails, vendor portals, and RFQ systems at the top of the page.

Use the search bar to find specific companies by name or URL. Filter results by selecting a country from the "All Countries" dropdown or choose a focus area like "PFAS/EPR", "BuyAmerica", or "EUDR" from the "All Focus Areas" dropdown. Click the **"Refresh"** button to reload the latest data from the database.

Each lead displays the company name, country, focus area, contact information (emails and phones), and special features like vendor portals or RFQ systems. Click the external link icon next to any company to visit their website. Export your filtered results by clicking the **"Export CSV"** button, which downloads a spreadsheet with all lead details including emails, phones, and portal information.

## Managing Your Website

Access the **Database** panel in the Management UI to view and edit lead records directly. Use the **Settings** panel to configure the website name, logo, and other preferences. Monitor traffic and usage through the **Dashboard** panel after publishing your site.

To collect fresh data from companies, run the scraping script from your server using `node scripts/scrape-leads.mjs` in the project directory. The script processes 50 companies at a time and updates the database with emails, phone numbers, contact pages, vendor portals, and RFQ system information.

## Next Steps

Talk to Manus AI anytime to request changes or add features. Start exploring the leads data to identify companies with vendor portals or RFQ systems for targeted business development opportunities.
