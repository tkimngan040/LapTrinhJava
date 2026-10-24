# Appendix B. User Interface Specification

This appendix is the element-by-element companion to Section 2.10 of Chapter 2. For every screen listed in Section 2.10.2 it records each interactive element, the user interaction and the required system response, following the specification format of Section 2.10.3. The mockups are Figures 2.7 to 2.29 in Section 2.10.4.

Statements using *shall* are requirements on the implementation. Statements marked *Note* record design decisions and review remarks for the implementation team.

## Role access by screen

| # | Screen | PSA | BA | OM | TE | IS | VW | CU |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| B.1 | Login / Authentication | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| B.2 | Dashboard | ✓ | ✓ | ✓ | — | — | read-only | — |
| B.3 | Notifications / Alerts | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| B.4 | Profile / Account | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| B.5 | Brands | ✓ | own brand | — | — | — | — | — |
| B.6 | Perfume Products | ✓ | ✓ | read | — | read | — | — |
| B.7 | Machines | ✓ | ✓ | ✓ | ✓ | read | — | — |
| B.8 | Transactions | ✓ | ✓ | ✓ | — | — | — | — |
| B.9 | Inventory | ✓ | ✓ | ✓ | — | ✓ | — | — |
| B.10 | Refill / Replacement | — | — | ✓ | ✓ | ✓ | — | — |
| B.11 | Maintenance | ✓ | ✓ | ✓ | ✓ | — | — | — |
| B.12 | Users & Roles | ✓ | own brand | — | — | — | — | — |
| B.13 | Reports | ✓ | ✓ | ✓ | — | — | read-only | — |
| B.14 | Settings | ✓ | own brand | — | — | — | — | — |
| B.15 | Kiosk Experience | — | — | — | — | — | — | ✓ |

Abbreviations follow Section 2.1.1. Every screen is further restricted to the tenant and scope assigned to the signed-in user (BR13).

## B.1. Login / Authentication

*Mockup: Figure 2.7.*

**1. English - Language Selection**

Users click the language selector in the top-right corner and choose a supported language. The interface updates its content to match the selected language.

**2. Email Address - Enter Email**

Users enter their registered email address. The system validates that the field is not empty and that the email format is correct. If the input is invalid, an error message appears below the field.

**3. Password - Enter Password**

Users enter their password. They can click the eye icon to show or hide the password. The password is masked by default.

**4. Remember Me - Keep Me Signed In**

Users can check or uncheck the Remember Me checkbox. If enabled, the system maintains the login session according to its security policies. The password shall not be stored directly in the browser.

**5. Forgot Password? - Password Recovery**

Users click the Forgot password? link.

The system redirects them to the password recovery screen.

Users enter their email address to request a password reset link.

Users open the valid link, enter a new password, and confirm it.

The system displays a success message and allows users to return to the login screen.

**6. Sign In - User Authentication**

Users enter their email address and password.

Users click the Sign In button.

The button changes to Signing in... to indicate that the system is processing the request.

If authentication fails, the system displays an error message.

If authentication succeeds, the system checks whether Two-Factor Authentication (2FA) is required and verifies the user's access permissions.

The system redirects users to the appropriate page based on their assigned roles.

Users cannot select their own roles to gain unauthorized access.

**7. Login with QR Code - QR Code Authentication**

Users click the Login with QR Code section.

If this feature is implemented, the system displays a QR code or instructions for opening the ScentStation mobile application to scan and approve the login request.

The system validates the QR code, checks its expiration time, and verifies approval from an authenticated device.

If the QR code expires, the system displays an option to generate a new code.

If QR code authentication is not supported by the project, this option should be removed from the official login interface.

**8. Secure Login with Role-Based Access - Security Information**

This section provides informational content rather than an interactive control. It informs users that the platform protects their data and restricts access according to assigned roles and permissions.

## B.2. Dashboard

*Mockup: Figure 2.8.*

**Viewer access.** A Viewer sees this screen in read-only mode. Every filter and drill-down works within the scope granted to the Viewer, but no control that creates, edits or deletes a record is rendered (FR1.11, UC-17).

| **Area**                    | **Interaction**                                                                                           | **Result**                                                                                            |
|-----------------------------|-----------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Search                      | Enter a machine name, product name, brand name, or transaction ID.                                        | Displays the relevant search results.                                                                 |
| Date & Brand Filters        | Select a date range or a brand.                                                                           | Updates KPIs, charts, and tables according to the selected filters and the user's access permissions. |
| KPI Cards                   | Click Total Brands, Total Machines, Total Transactions, Total Revenue, Total Dispenses, or Active Alerts. | Navigates to the corresponding detailed page.                                                         |
| Transaction & Revenue Trend | Select Daily or another time range, or hover over the chart.                                              | Displays transaction and revenue trends, along with data values for specific time points.             |
| Machine Status              | Select Online, Offline, Maintenance, or Error.                                                            | Filters the machine list by the selected status.                                                      |
| Top Performing Brands       | Select a brand or click View All.                                                                         | Displays brand performance and revenue details.                                                       |
| Recent Transactions         | Select a transaction.                                                                                     | Opens the transaction details and payment status.                                                     |
| Active Alerts               | Select an alert.                                                                                          | Displays the cause of the alert, the related machine, and recommended actions.                        |
| Fragrance Inventory Status  | Select a product with low stock.                                                                          | Opens the inventory details and replenishment process.                                                |
| Maintenance Overview        | Select a maintenance status or click View All.                                                            | Displays maintenance tickets and their progress.                                                      |
| Machine Locations           | Select a location marker on the map.                                                                      | Displays the machine ID, location, and latest reported status.                                        |

## B.3. Notifications / Alerts

*Mockup: Figure 2.9.*

**1. Alert Summary**

Users select All Alerts, Critical, High, Medium, or Low.

*System response:* The alert table is filtered according to the selected severity level. The numbers displayed on the summary cards shall be updated using actual system data and remain consistent with the applied filters.

**2. Alert Categories**

Users switch between the All Alerts, Machine Alerts, Inventory Alerts, and System Alerts tabs.

*System response:* The system displays only alerts belonging to the selected category. The categories shall reflect the types of events actually supported by the system.

**3. Search Alerts**

Users enter a machine ID, product name, alert type, or other relevant information in the Search Alerts field.

*System response:* The table displays matching results. If no results are found, the interface displays the message No alerts found.

**4. Severity, Status & Brand Filters**

All Severity: Select a severity level.

All Status: Select Open, Investigating, or Resolved.

All Brands: Select a brand within the user's authorized access scope.

Reset: Clear the currently applied filters.

*System response:* The alert list and result counts are updated according to the selected criteria. The All Brands filter is available only to accounts authorized to access multiple brands.

**5. Alert Table**

Each row displays the alert timestamp, machine ID, alert type, description, severity, status, and available actions.

Users click a row or select the three-dot menu (...) to view details or access permitted actions.

*System response:* The details panel on the right displays information about the selected alert. The status shall clearly distinguish between open, under investigation, and resolved alerts.

**6. Alert Details**

When users select an alert, they can view its occurrence time, machine ID, location, brand, product, remaining stock level, alert threshold, severity, status, and description.

*System response:* The system displays details corresponding to the selected alert. If sensor data has not been updated recently, the interface shall display the last update timestamp rather than presenting outdated values as current data.

**7. Mark as Resolved**

Authorized users select Mark as Resolved after investigating and addressing the underlying cause.

*System response:* The system confirms the action, updates the alert status, and records the user who performed the action and the resolution timestamp. If the underlying issue still exists, the alert shall not automatically be considered resolved simply because the user clicks the button.

**8. Create Maintenance Ticket**

An Operations Manager or another authorized user selects Create Maintenance Ticket when an alert requires technical intervention.

*System response:* The system opens a ticket creation form with the machine ID, related alert, and issue description pre-filled. Users provide the priority, assigned technician, and other required information before confirming ticket creation. The system shall prevent duplicate tickets for the same issue when an existing ticket is already being processed.

**9. View Machine Details**

Users click the relevant action to open the associated machine profile.

*System response:* The system navigates to the Machines module and displays the machine's status, connectivity, assigned products or perfume slots, and related alerts, subject to the user's access permissions.

**10. View History**

Users open the history of the related alert, machine, or product.

*System response:* The system displays recorded events, timestamps, statuses, and previous handling activities. Historical records are read-only and shall not be modified after they have been recorded.

## B.4. Profile / Account

*Mockup: Figure 2.10.*

**1. Profile Information**

Users enter or edit their Full Name and Phone Number.

Click the camera icon to upload a new profile picture or restore the default avatar.

Email Address and Role are read-only fields and cannot be edited.

Click Save Changes to save the updated information.

*System response:* If the information is valid, the system displays a success message. If the input is invalid, an error message appears next to the corresponding field, and the entered information is preserved so users can correct it.

**2. Change Password**

Enter the current password in the Current Password field.

Enter the new password in the New Password field.

Ensure that the new password meets the required criteria for length, uppercase letters, lowercase letters, numbers, and special characters.

Re-enter the new password in the Confirm New Password field.

Click Update Password.

Use the eye icon to show or hide password text.

*System response:* If the current password is incorrect or the new password and confirmation do not match, the system displays an error message and does not update the password. If the operation succeeds, the system displays a confirmation message and applies the session policies configured for the platform.

**3. Two-Factor Authentication (2FA)**

Users view their current 2FA status.

Click Enable 2FA to begin the setup process.

Complete verification using a method supported by the system.

Finish the verification process to enable 2FA.

*System response:* The status changes to Enabled when setup is completed successfully. If verification fails, the system displays an error message and allows users to try again according to the security policy.

Note: In the design, the button is labeled Enable 3FA, while the section title is Two-Factor Authentication (2FA). The button label should be corrected to Enable 2FA for consistency and accuracy.

**4. Preferences**

Language: Select the interface language.

Time Zone: Select the preferred time zone.

Date Format: Choose the date display format.

*System response:* The interface applies the selected preferences after users make their selections or confirm and save them, depending on the implementation. These preferences do not modify the underlying business data.

**5. Active Sessions**

The table displays the device, estimated location, IP address, last activity time, and session status.

Current Session: Represents the user's current login session. The design does not display a logout button for this session.

Log Out: Click this action to sign out of a session on another device.

If a confirmation dialog appears, users can confirm the action to proceed or cancel it.

*System response:* The system terminates the selected session after confirmation and updates its status once the operation succeeds. The interface shall reflect the actual session termination result.
## B.5. Brands

*Mockup: Figure 2.11.*

**1. Search Brands**

Users enter a brand name, such as Chanel, Dior, or Gucci, into the search field.

*System response:* The brand cards display only matching results. If no matching brand is found, the system displays “No brands found” and allows users to clear the search keyword.

**2. Status Filter**

Users select All, Active, Inactive, or Suspended, provided these statuses are defined in the business requirements.

*System response:* The list displays only brands matching the selected status. When the filter changes, the number of results and the displayed brand cards are updated accordingly.

**3. Sort By**

Users select a sorting criterion, such as Brand Name, Created Date, or Performance, depending on data availability and access permissions.

*System response:* The order of the brand cards changes according to the selected criterion. For Performance, the system shall clearly define the metric used for ranking, such as the number of transactions or revenue within the currently selected time period.

**4. Grid / List View**

Users select Grid to view brands as image cards or List to view brands in a tabular format.

*System response:* The system changes the display layout while preserving the search keyword, filters, and currently selected brand, provided the selection remains valid.

**5. Brand Card - Select a Brand**

Users click a brand card, such as Chanel.

*System response:* The selected card is highlighted, and the details panel on the right displays the corresponding brand's logo, description, status, contact information, products, machines, and related statistics. When users select another brand, the entire details panel updates to display information for the newly selected brand.

**6. Add Brand**

Users with brand management permissions click Add Brand.

Workflow:

The system opens the brand creation form.

Users enter the brand name, description, contact information, and website, if available.

Users upload the brand logo and images, if supported.

Users validate the entered information and click Save.

*System response:* The system validates the input data, checks for duplicate brand names according to the business rules, and saves the new brand. If the operation succeeds, the new brand card appears in the list. If it fails, the system displays an error message so users can correct the information.

**7. Edit Brand**

Users click Edit in the brand details panel.

The system opens a form populated with the existing brand information. Users modify the permitted fields and click Save Changes.

*System response:* The updated information is saved and reflected in both the brand card and the details panel. If users do not have permission to edit the brand, the system rejects the operation.

**8. Overview**

Users view the brand name, description, website, contact email, phone number, address, creation date, and status.

Read-only information is displayed directly. Users with editing permissions can click Edit to update the relevant information. The website may open an external link if this feature is configured and the URL has been appropriately validated.

**9. Products - Brand Products**

Users select the Products tab.

*System response:* The system displays the products associated with the currently selected brand, such as perfume names, bottle volumes, prices, and statuses, if these fields are included in the business requirements. Clicking a product opens its details in the Perfume Products module.

**10. Machines - Brand Machines**

Users select the Machines tab.

*System response:* The system displays the machines associated with the selected brand, including machine codes, locations, and operational statuses, subject to the user's access permissions. Selecting a machine opens the Machines module and displays the corresponding machine information.

**11. Transactions - Brand Transactions**

Users select the Transactions tab.

*System response:* The system displays transactions associated with the currently selected brand, within the permitted time range and the user's access permissions. Users can open a transaction to view its machine code, product, amount, and payment status.

**12. Analytics / Performance Overview**

Users select the Analytics tab or view the summary metrics at the bottom of the details panel.

*System response:* The system aggregates the number of products, number of machines, transaction count, and revenue within the selected time period. All metrics shall use consistent filtering criteria and calculation rules to prevent discrepancies.

**13. Brand Logo & Brand Images - Image Management**

Users with editing permissions click Change Logo or Add Image, select a file, and preview it before saving.

*System response:* The system validates the file format, file size, and permitted dimensions. After the image is saved successfully, the new image appears in the brand profile. If the file is invalid, the system displays the reason and asks users to select another file.

## B.6. Perfume Products

*Mockup: Figure 2.12.*

**1. Search Products**

Users enter a perfume name, brand, fragrance family, or category into the search field.

*System response:* The product cards are filtered according to the search keyword. If no matching results are found, the system displays “No products found” and allows users to clear the search keyword and try again.

**2. Brand, Category & Status Filters**

Users apply the following filters:

All Brands: Filter products by brand.

All Categories: Filter products by category or product group.

All Status: Filter products by status, such as Active, Inactive, or Draft, if supported by the business requirements.

Reset: Clear all applied filter conditions.

*System response:* The product cards are updated according to the selected filter conditions. Brand Administrators can only view products belonging to brands within their authorized scope.

**3. Product Summary Cards**

The Total Products, Active Products, Available for Machines, and Most Popular summary cards help users understand the current state of the product catalog.

Users click a summary card to filter the product list accordingly, if this functionality is supported by the design.

*System response:* The displayed statistics and product list shall remain consistent with the backend data. Most Popular shall be based on a clearly defined criterion, such as the number of product sampling sessions within a specified period, rather than automatically generated or fabricated statistics.

**4. Product Cards**

Each product card displays the perfume image, product name, brand, perfume type, price, rating, and stock status, if the relevant data is available.

Users click a product card to open its details in the panel on the right. The heart icon should only be retained if the system actually supports a favorites list or product bookmarking.

*System response:* The selected card is highlighted, and the details panel displays the correct information for the selected product.

**5. Add Product**

Users with product management permissions click Add Product and enter the following information:

Perfume name and brand.

Category, bottle volume, and description.

Selling price or price per spray, according to the business rules.

Product images and fragrance information, if available.

Product status.

*System response:* The system validates required fields, brand management permissions, and duplicate records according to the business rules. Once the product is saved successfully, it appears in the product list. Whether the product becomes available on a machine shall follow the separate distribution configuration.

**6. Edit Product**

Users select a product, click Edit, modify the permitted information, and click Save Changes.

*System response:* The system validates the input data, saves the updated information, and refreshes the product card. If the product is already assigned to machines or has historical transactions, any changes shall comply with the business rules to avoid inconsistencies in historical data.

**7. Overview & Details**

Users switch between the Overview and Details tabs to view the product description, brand, category, bottle volume, price, status, and fragrance information.

*System response:* The displayed details change according to the currently selected product. Read-only fields cannot be edited directly; users with the appropriate permissions shall click Edit to modify them.

**8. Usage in Machines**

Users select the Usage in Machines tab to view the machines configured to use the selected product.

*System response:* The system displays the machine code, location, machine status, and relevant information about the product installed on each machine. Selecting a machine opens the Machines module.

Only machines that are actually linked to the product in the system configuration should be displayed. The system shall not assume that every product is available on every machine.

**9. Inventory – Perfume Inventory**

Users select the Inventory tab or click Manage Inventory.

*System response:* The system opens the related inventory information, such as the bottle currently in use, the remaining perfume volume, warning thresholds, and bottle replacement history, if these details are tracked.

Inventory Staff can perform replenishment or bottle replacement operations according to their assigned permissions.

The system shall distinguish between the product's commercial bottle volume (for example, 100 ml) and the remaining perfume volume in the bottle installed on a machine.

**10. Analytics – Product Analytics**

Users view the number of sampling sessions, product popularity, or transaction count within the selected time period.

*System response:* Charts and statistics are updated according to the selected time range, brand, and access scope. Only metrics supported by available system data and clearly defined calculation rules should be displayed.

**11. View in Customer App**

Users click View in Customer App to preview the product as customers would see it on the kiosk or fragrance sampling interface.

*System response:* The system opens a preview displaying the product image, name, brand, description, and price according to the public-facing configuration. If the product is not authorized for public display or is not yet available on a machine, the system shall clearly notify the user.

**12. Favorite – Add to Favorites**

If the platform supports a favorites feature, users click the heart icon on a product card.

*System response:* The icon changes its state, and the product is added to or removed from the user's favorites list.

If the project does not include this functionality, the heart icon should be removed to avoid unnecessary UI elements.

## B.7. Machines

*Mockup: Figure 2.13.*

**1. Machine Overview**

Users view the Total Machines, Online, Offline, and Maintenance summary cards.

When users click a summary card, the machine list is filtered by the corresponding category, if this functionality is supported.

*System response:* The machine counts and list are updated according to the system data. Each machine shall be counted in exactly one status category according to the defined status rules to avoid duplicate counting.

**2. Search Machines**

Users enter a machine code, location name, or other supported identifying information into the search field.

*System response:* The machine list and map locations are filtered to match the search results. If no matching results are found, the system displays “No machines found.”

**3. Status, Brand & Location Filters**

Users apply the following filters:

All Status: Filter machines by Online, Offline, Maintenance, or Error, if these statuses are supported.

All Brands: Filter machines by brand.

All Locations: Filter machines by installation location.

Reset: Clear all applied filter conditions.

*System response:* The map and machine list are updated consistently. Users can only view data within their authorized access scope.

**4. Map View**

Users select Map View, click a machine marker on the map, or use the zoom-in and zoom-out controls.

*System response:* The system displays the machine code, location, and most recent status. Selecting a marker highlights the corresponding machine in the list and opens its details.

The map shall use the saved coordinates of each location. If coordinates are unavailable, the system shall display the address instead of assigning an arbitrary location.

**5. List View**

Users switch from the map to a list or card view to quickly compare machine codes, locations, statuses, occupied slots, and other operational information.

*System response:* The interface changes its layout while preserving the current filters and selected machine, provided that the machine remains within the filtered results.

**6. Machine Card**

Each machine card displays the machine code, location, status, number of occupied slots, and operational metrics, if available.

Users click a machine card, such as SS-M08.

*System response:* The selected card is highlighted, and the details panel on the right displays information for the corresponding machine. The ... menu only displays actions permitted by the user's permissions.

**7. Machine Information**

Users view the machine code, brand, address, installation date, status, last activity time, and software version.

Users click Edit to update permitted information, such as the location or management details.

*System response:* The system validates the user's permissions, checks the input data, and updates the information after a successful save. Connection status information shall be updated by the monitoring system and shall not be manually edited like an ordinary text field.

**8. Real-time Sensors**

Users view the connection status and technical metrics supported by the actual device, such as voltage or temperature when the corresponding sensors are available.

*System response:* The interface displays the latest recorded values, their update timestamps, and normal or warning statuses when thresholds have been configured. If the machine loses its connection, previously recorded data shall be marked as the latest available data rather than presented as a current measurement.

**9. Perfume Slots**

Users select the Perfume Slots tab or click Manage Slots.

*System response:* The system displays each slot, the assigned product, the remaining perfume volume, and statuses such as Available, Low, or Empty, if supported.

Users with the appropriate permissions can assign products to slots or initiate a bottle replacement workflow. The system shall validate the configuration and record changes to keep the information synchronized with Inventory.

**10. Remote Control**

Users with operational permissions click Remote Control, select a command supported by the device, and confirm the action before sending it.

*System response:* The interface displays the command status, such as Pending, Succeeded, or Failed, based on actual responses. If the machine is offline or the user lacks the required permissions, the system rejects the command and explains the reason.

Control commands that have not been defined in the hardware design and IoT communication protocol shall not be added arbitrarily.

**11. Restart Machine**

Authorized users click Restart Machine. The system displays a confirmation dialog containing the machine code and a warning about potential service interruption.

*System response:* After confirmation, the system sends the restart command if the machine supports it and updates the progress based on the received response. The system shall only display success when there is evidence confirming that the operation succeeded. If the operation fails, the system provides relevant information for log inspection.

**12. View Logs**

Users click View Logs to view the history of connections, heartbeats, control commands, device errors, and recorded events.

*System response:* The log list can be filtered by time range, event type, and severity, if the available data supports these filters. Historical logs shall not be arbitrarily modified or deleted.

**13. Create Maintenance Ticket**

The Operations Manager or another authorized user clicks Create Maintenance Ticket, reviews the pre-filled machine code and issue description, and then provides the priority and any additional required information.

*System response:* The system creates a maintenance ticket in the Maintenance module and links it to the corresponding machine and related alerts, if available. If an unresolved ticket already exists for the same issue, the system shall display a warning to prevent duplicate tickets.

## B.8. Transactions

*Mockup: Figure 2.14.*

**1. Transaction Summary**

The summary cards include Total Transactions, Total Revenue, Unique Customers, and Top Product.

*User interaction:* Users view the overview or click a summary card to apply a quick filter, if supported by the interface.

*System response:* The system updates the metrics according to the selected time period, brand, and access permissions. The system shall distinguish between the total transaction amount and successfully paid revenue. Failed transactions shall not be included in recognized revenue.

**2. Date Range & Brand**

Users select a date range and brand from the toolbar at the top of the interface.

*User interaction:* Users select the start date, end date, and brand they want to view.

*System response:* Charts, summary cards, and the transaction list are reloaded according to the selected filters. The system shall use consistent time zones and calculation rules across all sections to prevent discrepancies in the reported figures.

**3. Transaction Trend**

Users view changes in transaction volume and revenue by day, week, or month, depending on the available data.

*User interaction:* Users select a time period or hover over a data point to view detailed values.

*System response:* The chart displays the corresponding transaction counts and revenue. Only actual data from the system shall be used; illustrative figures shall not be used in official reports.

**4. Top Products & Top Machines**

Users view the products with the highest transaction volumes and the machines with the most transactions within the selected time period.

*User interaction:* Users select a product or machine code to apply the corresponding filter.

*System response:* The transaction list is filtered by the selected product or machine. If no data is available, the system displays an empty state instead of generating artificial rankings.

**5. Search Transactions**

Users enter a transaction ID, machine code, perfume name, or other supported search information.

*User interaction:* Users enter a keyword and press Enter or click the search icon.

*System response:* The transaction table displays matching records. If no matching records are found, the system displays “No transactions found.”

**6. Status & Payment Filters**

Users apply the following filters:

All Status: Filter by Success, Failed, Pending, or other statuses supported by the actual system.

All Brands: Filter transactions by brand.

All Machines: Filter transactions by machine.

All Payment Methods: Filter by QR Code, MoMo, or other integrated payment methods.

Reset: Clear all currently applied filters.

*System response:* The transaction table and related metrics are updated according to the selected filter conditions. The Pending status shall be distinguished from Failed; a transaction that is still being processed shall not be immediately treated as a failed transaction.

**7. Transactions Table**

The table displays the main transaction information: Transaction ID, Date & Time, Product, Brand, Machine, Customer, Amount, Payment Method, Status, and Actions.

*User interaction:* Users review individual rows, sort by column if supported, and click the eye icon to open transaction details.

*System response:* The system opens the correct transaction record. When users close the details panel, the current filters and page position are preserved.

**8. Transaction Details**

When users select a transaction, the details panel on the right displays the transaction ID, payment status, product, brand, machine code, location, amount, payment method, and sampling time.

*User interaction:* Users click View Product, View Machine, or Download Receipt, if these features are supported.

*System response:* The system opens the corresponding product or machine module and downloads the receipt for the correct transaction when valid data is available. If the payment fails, the system shall display the error information or reference code provided by the payment system, if available.

**9. Export – Export Transaction Reports**

Users click Export to download data for reporting or reconciliation purposes.

*User interaction:* Users select a supported file format, define the data scope, and confirm the export.

*System response:* The system generates a CSV or Excel file if the functionality has been implemented, applying the user's access permissions and the relevant filters. The system shall notify users when the file is ready or when the export process fails.

**10. Tabs & Pagination**

Tabs such as All Transactions, By Machine, By Product, By Brand, and By Location provide different views of the same transaction data.

*User interaction:* Users switch between tabs, navigate to the next page, or change the number of rows displayed per page.

*System response:* The system displays the correct set of transactions and the total record count. When filters change, the current page should be reset to a valid position when necessary to avoid displaying an unnecessarily empty page.

## B.9. Inventory

*Mockup: Figure 2.15.*

**1. Inventory Overview**

The summary cards include Total Bottles, Total Volume, Low Stock Items, In Machines, and In Warehouse.

*User interaction:* Users click a summary card to filter the inventory list by the corresponding category, if this functionality has been implemented.

*System response:* The inventory list is updated according to the inventory data. The system shall distinguish between the number of bottles and the total perfume volume. It shall not double-count perfume volume stored in machines and perfume volume remaining in the warehouse.

**2. Search Inventory**

Users enter a perfume name, brand, SKU, or product code.

*User interaction:* Users enter a keyword into the search field.

*System response:* The table displays only matching inventory items. If no matching results are found, the system displays “No inventory items found.”

**3. Filters**

The interface supports filters such as All Brands, All Locations, All Status, and Reset.

*User interaction:* Users select the brand, warehouse, or status they want to view.

*System response:* The table and related metrics are updated according to the selected filter conditions. Users can only view data within their authorized brand scope, warehouse scope, and access permissions.

**4. Inventory Tabs**

Users switch between All Inventory, By Product, By Brand, By Location, Machine Stock, Warehouse Stock, and Stock Movements.

*User interaction:* Users click the tab they want to view.

*System response:* The system displays data according to the selected view. Stock Movements is used to review recorded inventory receipts, issues, transfers, and other stock changes.

**5. Inventory Table**

The table displays the product image, perfume name, brand, SKU, bottle count, total volume, available quantity, status, and storage location.

*User interaction:* Users select a row to view details or open the ... menu to access permitted actions.

*System response:* The details panel on the right is updated according to the selected product. The displayed figures shall clearly distinguish actual stock, available stock, and stock allocated to machines.

**6. Add Stock**

Authorized warehouse staff click Add Stock.

*User interaction:* 

Select the product and receiving warehouse.

Enter the number of bottles or the volume according to the inventory management unit.

Enter the batch number or supplier information if required by the business rules.

Review the information and confirm the stock receipt.

*System response:* The system validates the input data, records the stock receipt, and updates the inventory balance after the stock transaction is confirmed. If the data is invalid, the system displays an error message so users can correct it.

**7. Manage Stock**

Authorized users select Manage Stock to perform stock issuance, transfers between warehouses, or perfume allocation to machines.

*User interaction:* Users select the transaction type, product, quantity, source location, and destination location, if applicable. They then review the information and confirm the operation.

*System response:* The system validates the available quantity and the user's permissions. Once the operation is confirmed successfully, the inventory balances at the source and destination are updated consistently, and a stock movement record is created.

**8. Machines Using This Product**

Users view the list of machines containing the selected perfume bottle, including the machine code, location, slot, and remaining perfume volume, if this data is provided by the device.

*User interaction:* Users click a machine code to open Machine Detail.

*System response:* The system displays the correct machine and associated slot. If the remaining perfume volume is low, users can proceed to the replenishment or bottle replacement workflow.

**9. Warehouse Stock**

Users view the quantity of each product in individual warehouses, storage location codes, and available quantities.

*User interaction:* Users select a warehouse to view its inventory details or navigate to that warehouse's inventory list.

*System response:* The system filters the data by the correct location and displays the corresponding quantities. Transfers are only permitted when users have the required permissions and sufficient stock is available at the source location.

**10. Stock History**

Users select the Stock History tab to review previous stock receipts, issues, transfers, bottle replacements, and inventory adjustments.

*User interaction:* Users filter records by time period, product, transaction type, or reference number, if supported.

*System response:* The system displays the transaction timestamp, quantity change, person responsible, reason, and related documents, if available. The history shall reflect recorded inventory transactions and shall not be arbitrarily modified.

**11. Low Stock Alerts**

Users click Alerts or select the Low Stock Items summary card.

*User interaction:* Users review products that are running low, locations or machines with low perfume levels, and the corresponding warning thresholds.

*System response:* The system displays items requiring attention and allows users to open the details of the related product or machine. Alerts should be based on configured thresholds and the most recently updated data.

**12. Stock Trend**

Users view a chart showing changes in bottle counts or perfume volume over the selected time period.

*User interaction:* Users select the display unit, such as Bottles or Volume, if supported by the interface.

*System response:* The chart is updated according to the inventory history. Users can identify usage trends and plan replenishment activities. However, the chart shall not be treated as predictive analytics unless the system includes an actual forecasting feature.

**13. Product Actions**

Users click the ... menu on a product row to access authorized actions, such as View Details, Stock Movement, or View History.

*System response:* The system opens the corresponding form or details view. Inventory adjustment operations shall require confirmation and record the person responsible, timestamp, and reason.

## B.10. Refill / Replacement

*Mockup: Figure 2.16.*

**1. Task Overview**

The summary cards include Total Tasks, Pending, In Progress, Completed, and Overdue.

*User interaction:* Users click a summary card to filter the task list by the corresponding status, if supported by the interface.

*System response:* The task list is updated according to the selected status. Each task shall be counted in the appropriate category according to the business rules. Overdue tasks shall be determined based on their assigned deadlines and current statuses.

**2. Search Tasks**

Users enter a task ID, machine code, perfume name, location, or technician name.

*User interaction:* Users enter a keyword into the search field.

*System response:* The table displays matching tasks. If no matching results are found, the system displays “No tasks found.”

**3. Brand, Status & Location Filters**

Users filter tasks by All Brands, All Status, and All Locations, or select Reset to clear the filters.

*User interaction:* Users select the conditions they want to search by.

*System response:* The task list and related metrics are updated according to the selected filters while respecting the user's access permissions.

**4. Create Refill Task**

The Operations Manager or another authorized user clicks Create Refill Task.

Workflow:

Select the machine that requires attention.

Select the relevant product and perfume slot.

Select the task type: Refill or Replace.

Enter the current stock level or reason for the operation, if required.

Select the priority, deadline, and assigned technician.

Review the information and click Create Task.

*System response:* The system validates the information, generates a task ID, and displays the new task in the list. If no suitable bottle is available in the warehouse, the system shall display a warning before the task is assigned for execution.

**5. Task List**

The table displays Task ID, Machine, Product, Current Level, Action Type, Status, Scheduled Date, Technician, and Actions.

*User interaction:* Users select a row to view details or click the ... menu to access permitted actions.

*System response:* The details panel on the right displays the correct selected task. The perfume level and machine status shall reflect the most recently recorded data.

**6. Task Details**

Users view the task ID, task type, product, machine code, location, stock level, technician, deadline, priority, and description.

*User interaction:* Users click Edit Task to modify permitted information or click Mark as In Progress to begin the task, if the current status allows this transition.

*System response:* The system validates the user's permissions and the conditions for the status transition before saving. All changes are recorded in the task history.

**7. Technician Assignment**

Authorized users select the assigned technician or change the assignee when necessary.

*User interaction:* Users select a suitable technician, set the deadline, and provide handover information.

*System response:* The task is updated with the assigned technician. The technician receives a notification if the notification feature has been implemented. Assignment history shall be recorded to maintain traceability and accountability.

**8. Refill / Replacement Process**

Technicians open the Refill/Replacement Process tab to follow the steps required to complete the task.

*User interaction:* Technicians mark individual steps as completed and record the required information.

*System response:* The interface updates the progress after the completion information is saved and confirmed. The system only allows users to proceed to the next step when all required conditions have been satisfied.

**9. Inventory Confirmation**

The assigned personnel verify the product, the quantity or volume used, and the source of the supplied bottle.

*User interaction:* Users select the bottle or inventory batch, enter the actual quantity used if required by the business rules, and confirm its usage.

*System response:* The system records the inventory movement and links it to the task. If the actual quantity does not match the issued quantity, the system displays a warning so the discrepancy can be investigated before the task is completed.

**10. Testing & Completion**

After refilling or replacing a bottle, technicians verify the installation, slot configuration, and perform testing according to the approved procedure.

*User interaction:* Technicians record the test results, add notes, and click Complete Task when all required conditions have been satisfied.

*System response:* The system saves the test results and changes the task status to Completed if all requirements are met. If testing fails, the task shall remain in an appropriate in-progress status or be transferred to the relevant incident-handling workflow.

**11. History & Notes**

Users open the History or Notes tab to review assignment activities, status changes, task execution results, and technician notes.

*User interaction:* Users filter the history by time period or add notes if they have the required permissions.

*System response:* The system displays who performed each action, when it occurred, and what information changed. Important historical records shall not be arbitrarily modified.

## B.11. Maintenance

*Mockup: Figure 2.17.*

**1. Maintenance Summary**

The summary cards display Total Tickets, Open, In Progress, Completed, Avg. Resolution Time, and Overdue.

*User interaction:* Users click a summary card to filter the ticket list by the corresponding status, if quick filtering has been implemented.

*System response:* The maintenance ticket table is updated according to the selected status. The average resolution time shall be calculated from actual ticket data rather than a fixed value.

**2. Maintenance Trend**

The chart displays the number of tickets created, completed, and overdue within the selected time period.

*User interaction:* Users select a daily or monthly view and hover over the chart to view detailed figures, if supported.

*System response:* The chart is updated according to the selected time period and filters. Managers can identify periods when incidents increase and proactively allocate maintenance personnel.

**3. Tickets by Issue Type**

Issue categories may include Pump Error, Door Sensor Fault, Connection Lost, Payment Device Error, Spray Nozzle Clogged, and Screen Issue.

*User interaction:* Users click an issue type to filter the ticket list by that category.

*System response:* The system displays the corresponding tickets, helping managers identify incident categories that require priority attention. Issue types shall be consistent with the system's actual incident classification.

**4. Upcoming Maintenance**

This section displays the machine code, location, scheduled time, and maintenance type, such as Preventive or Inspection.

*User interaction:* Users select a scheduled maintenance item to view the machine information and tasks that need to be performed.

*System response:* The system opens the maintenance schedule details. If scheduling functionality is available, authorized users can create new schedules or modify the scheduled time and assigned personnel.

**5. Create Ticket**

The Operations Manager or another authorized user clicks Create Ticket.

Workflow:

Select the machine requiring maintenance.

Select the issue type or preventive maintenance type.

Enter the description, priority, and supporting images, if available.

Assign a person responsible for handling the ticket and set the resolution deadline.

Review the information and confirm ticket creation.

*System response:* The system generates a ticket ID, displays the ticket in the list, and records the creator and creation timestamp. If an unresolved ticket already exists for the same issue on the same machine, the system may display a warning to prevent duplicate tickets.

**6. Ticket Tabs & Filters**

The tabs include All Tickets, Open, In Progress, Completed, Overdue, On Hold, and Cancelled.

*User interaction:* Users select a tab, enter a ticket ID or machine code in the search field, and filter by brand, location, priority, or issue type.

*System response:* The table displays only matching tickets. The Reset button clears the applied filters. Data visibility remains restricted according to the user's role and permissions.

**7. Maintenance Ticket Table**

The table displays Ticket ID, Machine, Location, Issue Type, Priority, Status, Assigned To, Created Date, and Actions.

*User interaction:* Users click a row or ticket ID to open the details. They can also click the ... menu to access permitted actions.

*System response:* The details panel on the right displays the selected ticket. When users change pages or filters, the interface shall maintain data consistency.

**8. Ticket Details**

The details panel on the right displays the ticket ID, machine, location, brand, issue type, priority, status, assigned personnel, deadline, and issue description.

*User interaction:* Users click View Machine to open Machine Detail, click Edit to modify permitted fields, or click Assign to assign the ticket if they have the required permissions.

*System response:* The system validates the changes before updating the information. Important changes shall be recorded in the ticket history for future traceability.

**9. Inspection Checklist**

Technicians inspect items relevant to the issue, such as the power supply, connection, pump, spray nozzle, and door sensor.

*User interaction:* Technicians mark each checklist item, record the results, and add notes or photos when necessary.

*System response:* The system saves the inspection results. If any mandatory item has not passed inspection, the system shall prevent the ticket from being completed. The technician shall record the reason or proceed to the next appropriate troubleshooting step.

**10. Activity & Timeline**

This section displays events such as ticket creation, assignment, inspection start, waiting for spare parts, status updates, and completion.

*User interaction:* Users open the Activity or Timeline tab to review the progress of the maintenance process. They can add comments if this feature is supported.

*System response:* Each event records the person responsible and the timestamp. The history should not be arbitrarily modified because it serves as an audit trail for maintenance accountability.

**11. Attachments**

Technicians or ticket creators attach device images, inspection videos, or related documents.

*User interaction:* Users click Add Attachment, select a valid file, and upload it.

*System response:* The file is linked to the correct ticket after a successful upload. The system displays an error if the file format, file size, or access permissions do not meet the requirements.

**12. Start Maintenance / Mark as Completed**

Technicians click Start Maintenance when beginning the work and Mark as Completed after resolving the issue.

*User interaction:* Technicians perform the maintenance work, update the checklist, record the results, and confirm completion.

*System response:* The ticket status changes according to the valid workflow. Upon completion, the system records the completion timestamp, the person who performed the work, and the test results. The machine shall only be marked as operational when sufficient evidence confirms that it is functioning normally.

## B.12. Users & Roles

*Mockup: Figure 2.18.*

**1. User Summary**

The summary cards display Total Users, Active Users, Inactive Users, and Total Roles.

*User interaction:* Users click a summary card to filter the corresponding list, if quick filtering has been implemented.

*System response:* The user table is updated according to the selected condition. All statistics shall be calculated from actual system data rather than hardcoded values in the interface.

**2. Search & Filters**

The interface provides a search field, the All Roles, All Brands, and All Status filters, and a Filter button.

*User interaction:* 

Enter a name, email address, or user ID.

Select the role to view.

Select the brand and account status.

Click Filter to apply the conditions or Reset to clear them.

*System response:* The list displays accounts matching the search keyword and selected filters, within the access scope of the currently logged-in user.

**3. Users Tab**

The table displays User, Role(s), Department, Brand Access, Status, Last Active, and Actions.

*User interaction:* Users click a row or username to open the corresponding profile details. They can select checkboxes to perform bulk operations if supported.

*System response:* The corresponding profile appears in the panel on the right. Bulk operations shall require confirmation before execution.

**4. Invite User**

Authorized users click Invite User to create an account invitation.

Workflow:

Enter the user's full name and email address.

Select a role, such as Brand Admin, Technician, Inventory Staff, or Viewer.

Select the brand or data access scope the user is permitted to access.

Review the assigned permissions and send the invitation.

*System response:* The system validates the email address, the inviter's permissions, and the input data. It then creates the invitation and displays a status such as Invitation Sent or Pending. The system shall not automatically grant the highest administrative privileges to a new account.

**5. Roles Tab**

The system displays a list of roles, such as Platform Super Admin, Brand Admin, Operations Manager, Technician, Inventory Staff, and Viewer.

*User interaction:* Users select a role to view its description, the number of assigned users, and its associated permissions. Authorized administrators can create or edit custom roles if permitted by the business requirements.

*System response:* The system displays the permissions associated with the selected role and warns users if a change affects multiple accounts. Critical system roles shall be protected against unauthorized modification or deletion.

**6. Permissions Tab**

This section manages permissions to view, create, edit, delete, or approve operations within each module.

*User interaction:* Users select a role, view the permission matrix, and modify configurable permissions they are authorized to change.

*System response:* The system validates the operator's permissions, displays a warning before saving significant changes, and records the changes in the audit history. Access permissions shall be enforced by the backend, not merely by hiding buttons in the user interface.

**7. Brand Access**

The details panel displays the brands that a user is permitted to manage or view.

*User interaction:* Users click Edit to modify the brand access scope if the currently logged-in user has the required permissions.

*System response:* The list of accessible brands is updated after a successful save. Brand Administrators shall not be allowed to grant themselves access to brands outside their authorized scope.

**8. User Profile**

The panel on the right displays the user ID, name, email address, phone number, role, status, creation date, and last active time.

*User interaction:* Users click Edit to update the information they are permitted to modify.

*System response:* The system validates the input data, saves the changes, and displays a success or error message. Fields such as the user ID and system identity information should generally not be directly editable.

**9. Quick Actions**

Available actions may include Reset Password, Deactivate User, and View Audit Logs.

*User interaction:* 

Reset Password: Initiate a password reset through a secure authentication process.

Deactivate User: Display a confirmation dialog and request a reason if required.

View Audit Logs: Open the account's activity history.

*System response:* Successful operations shall display a clear confirmation message. If the user lacks the required permissions, the system rejects the operation without modifying any data.

**10. Access Requests & Audit Logs**

Access Requests is used to review requests for new or modified permissions. Audit Logs records important activities related to user accounts and access control.

*User interaction:* Users open the relevant tab and filter records by user, time period, or status. Authorized personnel can approve or reject requests.

*System response:* The system records the decision, the person responsible, the timestamp, and the reason. Approvals shall comply with the access control policies. Users shall not be allowed to approve their own privilege escalation requests unless explicitly permitted by the applicable policy.

## B.13. Reports

*Mockup: Figure 2.19.*

**Viewer access.** A Viewer may open, filter and compare reports within the granted scope. *Export Report* is rendered only when the Viewer holds export permission, and *Custom Report* is not available to a Viewer (FR1.11, UC-17).

**1. Date Range**

At the top of the page, users select a start date and an end date, such as one week, one month, or a custom date range.

*User interaction:* Users click the date picker, select the desired period, and apply the selection.

*System response:* The summary cards, charts, and report tables are updated according to the selected date range. When comparing results with a previous period, the system shall use an equivalent time range.

**2. KPI Cards**

The summary cards at the top include Total Revenue, Total Transactions, Total Sprays, Active Machines, and Unique Customers.

*User interaction:* Users review the metrics and click a card to navigate to a detailed report, if this functionality is supported.

*System response:* The system displays the metrics for the selected period and the percentage or amount of increase or decrease compared with the previous period. All metrics shall be calculated from actual data. Active Machines shall have a clearly defined operational status.

**3. Report Categories**

The tabs include Overview, Sales Performance, Machine Performance, Product Insights, Inventory, Maintenance, User Activity, and Custom Report.

*User interaction:* Users click the tab they want to view.

*System response:* The system switches to the corresponding report category while preserving the selected date range and relevant filters, if supported. Tabs should only be displayed when the corresponding business functionality and data are available in the project.

**4. Revenue Trend**

The chart displays revenue and transaction counts over time.

*User interaction:* Users select Daily, Weekly, or Monthly, if these options are available, and hover over a data point to view detailed information.

*System response:* The chart updates according to the selected time grouping. Administrators can identify days when revenue increases or decreases and compare these changes with transaction volumes.

**5. Revenue by Brand**

The pie chart displays each brand's share of total revenue.

*User interaction:* Users select a brand in the legend or click a chart segment, if interactive filtering has been implemented.

*System response:* The system displays the corresponding revenue and percentage share. The selected brand can also be used to filter related tables. Brand Administrators can only view data for brands within their authorized scope.

**6. Report Filters**

The filter panel on the right includes Time Range, Brand, Location, and Machine, along with the Apply Filters and Reset buttons.

*User interaction:* 

Select the time range.

Select the brand to analyze.

Select the machine installation location.

Select a specific machine, if necessary.

Click Apply Filters.

*System response:* All relevant report components are updated according to the selected filters. Reset restores the default filter conditions. The system shall continue to enforce data access permissions.

**7. Top Performing Machines**

The ranking table displays the machine code, location, revenue, and number of sprays.

*User interaction:* Users click View All to open the complete list or select a machine code to open Machine Detail.

*System response:* Users can view the details of the selected machine and compare performance across locations. The ranking criteria shall be clearly defined, such as revenue, transaction count, or number of sprays.

**8. Top Perfume Products**

The table displays the product name, brand, number of sprays, and corresponding revenue.

*User interaction:* Users select a product or click View All to view the detailed report.

*System response:* The system displays product performance for the selected period. Spray counts shall be distinguished from payment transactions because not every spray necessarily corresponds to a new transaction.

**9. Transactions by Payment Method**

The chart categorizes transactions by QR Code, e-wallets, cards, or other integrated payment methods.

*User interaction:* Users select a payment method to view its share or filter the transaction list, if supported.

*System response:* The system displays the corresponding transaction count and percentage. The report shall clearly define whether it includes only successful transactions or also failed, cancelled, and refunded transactions.

**10. Sales by Location**

The bar chart compares revenue across machine installation locations.

*User interaction:* Users click a location or select View All to view other locations.

*System response:* The report is filtered by the selected location. Managers can identify locations with high or low revenue to evaluate customer demand and operational performance.

**11. Revenue vs. Sprays**

The scatter plot compares revenue with the number of sprays for individual machines or locations.

*User interaction:* Users hover over a data point to view detailed information and select a machine or location if the chart supports filtering.

*System response:* Administrators can observe the relationship between machine usage and revenue. The chart only shows correlation and does not independently establish the causes of revenue increases or decreases.

**12. Daily Performance Heatmap**

The heatmap displays transaction volume or spray activity by day of the week and time slot.

*User interaction:* Users select the metric they want to view, such as Transactions or Sprays, if a metric selector is available.

*System response:* The colors change according to activity intensity. Managers can identify peak hours to plan perfume replenishment or schedule maintenance appropriately.

**13. Export Report**

Users click Export Report to download a report.

*User interaction:* Users select a supported format, such as CSV, Excel, or PDF, review the date range, filters, and report type, and then initiate the export.

*System response:* The system generates a file using data permitted by the user's access rights and notifies the user when the export is complete. If the export fails, the system displays an error message and allows the user to try again.

**14. Custom Report**

Users select metrics, a date range, brands, machines, and data grouping options if custom reporting functionality has been implemented.

*User interaction:* Users select the fields they want to analyze, preview the results, and click Generate Report.

*System response:* The system generates a report according to the valid configuration. Only data fields and aggregation operations actually supported by the system shall be available.

## B.14. Settings

The Settings screen is organised as nine tabs, specified in B.14.1 to B.14.9.

### B.14.1. General tab

*Mockup: Figure 2.20.*

**1. Platform Information**

This section includes the platform name, slogan, description, and ScentStation logo.

*User interaction:* 

Edit the platform name, slogan, or description.

Click Change Logo to select a new image.

Review the preview.

Click Save Changes to save the updates.

*System response:* The system validates the input data and image format. After a successful save, the branding information is updated wherever the corresponding configuration is used. The Remove button shall display a confirmation dialog before deleting the logo.

**2. Appearance & Theme**

This section includes Light, Dark, and Auto modes, the primary color, language, time zone, and date and time formats.

*User interaction:* Users select the preferred theme, colors, and other options, then save the changes if required by the system.

*System response:* The interface preview changes according to the selected options. If Auto is selected, the theme may follow the device or operating system's appearance settings. Language and time formatting are applied according to the selected configuration scope.

**3. System Preferences**

The switches in the interface include:

Enable multi-brand mode

Enable machine monitoring

Enable analytics & reports

Allow user registration by invitation only

Enable maintenance reminders

Enable data export

*User interaction:* Users enable or disable configurable options, review their impact, and save the changes.

*System response:* The system validates the user's permissions and the conditions for applying the changes. For settings that affect the entire platform, the system shall display a warning before applying changes. Disabling a feature shall not automatically delete existing data.

**4. Email Settings**

This section includes SMTP Server, Port, Sender Email, Sender Name, and Encryption.

*User interaction:* 

Enter the email server information provided by the organization.

Select the appropriate encryption method.

Click Test Connection.

Review the test result and save the configuration.

*System response:* The system tests the connection and displays a success or error message. SMTP passwords and authentication credentials shall be protected and shall not be publicly displayed or stored directly in the interface.

**5. Notification Settings**

The notification channels in the interface include Email, In-App, SMS, Maintenance Alerts, and Payment Alerts.

*User interaction:* Users enable or disable individual channels, select the notification categories they want to receive, and save the configuration.

*System response:* The system updates the corresponding settings. If SMS has not been integrated with a provider, the interface shall indicate that the feature is unavailable rather than simulate a successful delivery. Notifications related to machine errors, payments, or maintenance shall follow the rules of their respective business processes.

**6. Data Management**

This section includes Backup Data, Restore Data, Clear Cache, Export Configuration, and Import Configuration.

*User interaction:* 

Backup Data: Create a backup within the permitted scope.

Restore Data: Select a backup and confirm the restoration.

Clear Cache: Request cache clearance.

Export Configuration: Download configuration data that the user is authorized to export.

Import Configuration: Select a configuration file and validate it before applying the changes.

*System response:* The system displays the actual operation progress and result. Data restoration and configuration imports shall include validity checks, confirmation requirements, and audit logging because they may affect system operations.

**7. Security Settings**

The Settings screen may link to a dedicated security section for managing password policies, two-factor authentication, session timeouts, and access permissions.

*User interaction:* Administrators open the Security tab, modify permitted settings, and confirm the changes before saving.

*System response:* The system validates the configuration, applies the security policies, and records important changes. The system shall not allow configurations that weaken mandatory security protections without appropriate safeguards.

**8. Integration Settings**

This section is used to configure connections to payment services, notification providers, and IoT components such as APIs or MQTT, if included in the project's architecture.

*User interaction:* Users select an integration, enter the supported parameters, test the connection, and save the configuration.

*System response:* The system displays the connection status based on the actual test results. API keys, passwords, and other secrets shall be masked and stored securely.

**9. Audit Logs**

This section provides traceability for configuration changes, including who made each change, when it occurred, and the outcome of the operation.

*User interaction:* Users open Audit Logs and search by operator, time period, or action type.

*System response:* The system displays recorded events. Access to modify or delete security audit logs shall be restricted to preserve auditability and traceability.

### B.14.2. Brands tab

*Mockup: Figure 2.21.*

**1. Brands – Brand List**

The table on the left displays the brand name, brand code, status, number of locations, number of machines, and creation date.

*User interaction:* 

Enter a brand name or code in the Search brand field.

Select All Status to filter by Active, Pending, or Inactive.

Click a brand row to view its details.

Click Add Brand to open the new brand creation form, if the user has the required permissions.

*System response:* The list is filtered, or the selected brand profile is displayed in the panel on the right. When creating a new brand, the system validates the brand code and all required fields.

**2. Basic Information**

This section displays Brand Name, Brand Code, Tagline, Description, Status, Created Date, and Last Updated.

*User interaction:* 

Click Edit.

Modify the fields that are permitted to be changed.

Review the information.

Click Save Changes.

*System response:* The system validates the input data, saves the information, and updates the modification timestamp. The brand code should be managed carefully to prevent changes that could cause inconsistencies in linked data.

**3. Visual Identity**

This section includes the logo, banner, primary color, secondary color, and accent color.

*User interaction:* 

Click Upload to select a logo or banner.

Choose colors using the color palette or enter color codes.

Preview the images and colors.

Click Save Changes to apply the updates.

*System response:* The system validates the image format, file size, and dimensions. If an image is invalid, the system displays a specific error message. Changes are applied only after the information has been saved successfully.

**4. Operational Settings**

This section includes the default currency, time zone, maximum number of locations, maximum number of machines, and options such as Enable Product Sampling, Show Brand in Customer App, and Allow Custom Pricing.

*User interaction:* 

Modify limits according to the permitted policies.

Enable or disable individual features.

Review the impact of the changes before saving.

*System response:* The system validates the configured limits and the user's editing permissions. If a new limit is lower than the existing number of machines or locations, the system shall display a warning and handle the situation according to the business rules rather than automatically deleting data.

**5. Access & Permissions**

This section includes Data Isolation and Allow Brand Admin to Manage Products.

*User interaction:* Authorized users select or deselect the available options, then confirm and save the changes.

*System response:* The system enforces permissions at the backend level. Machine, transaction, customer, and product data shall be restricted to the correct brand scope. The system shall not rely solely on hiding data in the interface while neglecting server-side authorization checks.

**6. Locations & Machines**

This section displays the number of locations and machines belonging to the currently selected brand.

*User interaction:* Users click a count or details link to open the corresponding location or machine list, if this functionality has been implemented.

*System response:* The system navigates to the Machines module or location management section with the selected brand filter applied. Users can only access data within their authorized scope.

**7. Quick Actions**

Available actions include View Brand Page, Manage Products, Machine Settings, Payment & Pricing, and View Brand Analytics.

*User interaction:* Users click the action they want to perform.

*System response:* The system opens the corresponding functional screen and preserves the currently selected brand filter when appropriate. Buttons for features that have not been implemented shall not be displayed as if they were functional.

**8. Brand Status**

Brand statuses may include Active, Pending, and Inactive, depending on the project's workflow.

*User interaction:* Authorized users change the brand status or submit a request for approval.

*System response:* The system displays a confirmation dialog when necessary, updates the status, and records the action in the audit log. When a brand is deactivated, the system shall clearly define the impact on product visibility, machines, and transactions that are still being processed.

**9. Save Changes**

*User interaction:* After editing the information, users click Save Changes. If they do not want to apply the changes, they can cancel or exit edit mode.

*System response:* The system displays the saving status, followed by a success or failure message. If there are unsaved changes, the system shall warn users before they leave the page.

### B.14.3. Machines tab

*Mockup: Figure 2.22.*

**1. Machines - Machine List**

The left panel displays the machine code, brand, location, and status, such as Online, Low Refill, Offline, and Maintenance.

*User interaction:* 

Enter the machine code or location in the search field.

Filter machines by brand, location, or status.

Click the machine you want to manage, such as SS-M08.

Use pagination to view the remaining machines.

*System response:* 

The details panel on the right updates according to the selected machine. If no machines match the search criteria, the system displays an empty state and allows the user to clear the filters.

**2. Basic Information**

This section displays the machine name, machine code, brand, location, and description.

*User interaction:* 

Select a machine, click an editable field, update the information, and then click Save Changes.

*System response:* 

The system validates the data, verifies access permissions, and checks whether the machine code is valid. If the operation succeeds, the updated information is saved. If it fails, the system displays an error message so the user can make the necessary corrections.

Note: The machine code should generally be managed as a stable identifier and should not be changed arbitrarily.

**3. Status & Health**

This section displays the connection status, last activity time, uptime, temperature, humidity, perfume level, and active errors.

*User interaction:* 

Select a machine and review its metrics. If the machine is offline or the perfume level is low, navigate to the Operations, Inventory, or Maintenance module to address the issue.

*System response:* 

Data is updated from the device or backend according to the configured update interval. If the data is outdated or unavailable, the interface shall display the last update time rather than continuing to present the information as real-time data.

**4. Dispensing - Perfume Dispensing Configuration**

This tab is used to configure dispensing parameters, such as dispensing duration, the number of sprays per transaction, the waiting time between sprays, and the daily dispensing limit.

*User interaction:* 

Open the Dispensing tab, adjust the parameters within the permitted limits, review any warnings for invalid values, and then save the configuration.

*System response:* 

The system validates the configured limits and sends the configuration to the machine using the implemented synchronization mechanism. The status shall clearly distinguish between Saved and Synced. A successful save does not necessarily mean that the machine has received the configuration.

**5. Product Configuration**

This section allows users to view or select the perfume products assigned to a machine and review related information, such as bottle positions, perfume levels, and product statuses, if supported by the system.

*User interaction:* 

Open the Product Configuration tab, review the product list, modify product assignments if authorized, and save the changes.

*System response:* 

The system verifies that each product belongs to the correct brand and that the configuration is valid. If a perfume bottle is running low or is no longer available, the interface shall display a warning and direct the user to the Inventory or Refill / Replacement module.

**6. Network & Connectivity**

This section contains the endpoint configuration, connection status, and device connectivity parameters based on the actual IoT architecture.

*User interaction:* 

Authorized users can review connection information, adjust permitted parameters, and perform a connectivity test if a corresponding function is available.

*System response:* 

The system displays the test result, the last connection time, and any errors. Sensitive information, such as tokens or connection keys, shall be masked and securely protected.

**7. Display & Media**

This section is used to configure the display language or instructional content on the device, if the machine supports a screen.

*User interaction:* 

Select the language, instructional content, or supported interface settings, and then save the configuration.

*System response:* 

The interface confirms whether the configuration is valid and displays its synchronization status. Media management features should not be provided if the actual machine model does not have a display.

**8. Location Settings**

This section includes operating hours, time zone, and sleep mode, if supported by the device.

*User interaction:* 

Adjust the opening time, closing time, and time zone, and then save the changes.

*System response:* 

The system validates the configured time range and synchronizes the settings according to the device's synchronization mechanism. If a change may affect customer service availability, the system shall display a warning before applying it.

### B.14.4. Payment tab

*Mockup: Figure 2.23.*

**1. Payment Overview**

This section displays key metrics, including Total Revenue, Successful Transactions, Failed Transactions, and Refunded Transactions.

*User interaction:* 

Select the brand scope from the top navigation bar.

Select a date range if the interface supports this feature.

Click a metric to open the corresponding transaction list if a link is available.

*System response:* 

The system updates the metrics based on actual transaction data and the user's access permissions. Gross revenue, refunds, and net revenue shall be clearly distinguished to prevent misinterpretation of the figures.

**2. Payment Methods**

The interface displays supported payment methods, such as VietQR, MoMo, ZaloPay, VNPAY, bank cards, and on-site cash payments, if supported by the business requirements.

*User interaction:* 

Select the payment method to configure.

Toggle the Active switch on or off.

Click the gear icon to open the configuration panel.

Click Add Payment Method to add a new payment method if the system supports this function.

*System response:* 

The payment method's status is updated after the changes are successfully saved. When a payment method is disabled, the system shall stop offering it for new transactions without deleting historical transaction data or automatically canceling transactions that are already in progress.

**3. Method Configuration**

When VietQR is selected, this section displays the payment method information, display name, description, bank, recipient account information, and configuration tabs.

*User interaction:* 

In General, edit the display name and description.

In Transaction Settings, configure the supported transaction parameters.

In Webhook, configure or verify the mechanism for receiving payment result notifications.

In Advanced, adjust advanced settings for which the user has permission.

Click Test Connection to test connectivity if the integration supports this function.

Click Save Changes to save the configuration.

*System response:* 

The system validates the data, checks connectivity, and displays a success or error message. Sensitive information shall be masked. API keys and sensitive authentication credentials should not be placed in publicly visible fields.

**4. Payment Flow Settings**

This section includes Payment Timeout, Auto Cancel Pending Payment, Show Payment Instructions, and Allow Multiple Attempts.

*User interaction:* 

Enter the payment timeout duration.

Enable or disable automatic cancellation of pending transactions that exceed the timeout.

Enable payment instructions on the machine.

Allow payment retries after a failed payment if consistent with the applicable policy.

*System response:* 

The system validates the values before saving. If a transaction exceeds the timeout, its status shall be handled consistently with the payment provider's result. A transaction shall not be considered failed based solely on a timeout before its final status has been verified.

**5. Pricing & Tax Settings**

This section includes Default Currency, Tax Rate (VAT), Price Display, and Allow Custom Pricing per Brand.

*User interaction:* 

Select the currency, enter the tax rate according to the applicable policy, choose whether displayed prices include or exclude tax, and then save the changes.

*System response:* 

The system validates the data and applies the pricing rules to new transactions within the configured scope. If each brand is allowed to set its own prices, the system shall clearly define the priority between the platform's default prices and the brand-specific prices.

Note: The tax rate shown in the image is for illustrative purposes only. It should not be assumed to be the correct tax rate for every product or at every point in time.

**6. Transaction Settings**

This section includes Enable Auto Refund, Send Payment Notifications, and Daily Reconciliation Report.

*User interaction:* 

Enable notifications for payment-related events.

Configure periodic reconciliation reports if this feature is supported.

Enable automatic refunds only when the business rules and payment integration genuinely support this functionality.

*System response:* 

The system saves the selected settings and executes the corresponding actions according to the configuration. For refunds, the system shall verify the eligibility conditions, refund amount, transaction status, and result reported by the payment provider. A refund shall not be initiated automatically solely because a transaction reports a temporary error.

### B.14.5. Notifications tab

*Mockup: Figure 2.24.*

**1. Notification Channels**

This section includes Email, In-App, SMS, Push Notification, and Webhook channels.

*User interaction:* 

Select the channel to configure from the left panel.

Check whether the channel is Active or Inactive.

Enable or disable the channel if authorized.

Click the channel to open its detailed configuration.

*System response:* 

The configuration panel in the center updates according to the selected channel. If an SMS or Push Notification provider has not been integrated, the system shall indicate that the channel is unavailable instead of falsely reporting success.

**2. Email Notification Configuration**

This section includes SMTP Server, Port, Sender Email, Sender Name, and Encryption.

*User interaction:* 

Enter the email server information provided by the organization.

Select the appropriate encryption method.

Click Test Connection to verify connectivity.

Enable or disable Enable Email Notifications.

Click Save Changes to save the configuration.

*System response:* 

The system validates the configuration and reports whether the connection succeeds or fails. The SMTP password and authentication credentials shall be stored securely and shall not be publicly displayed.

**3. Event Triggers**

Events relevant to ScentStation include:

Machine Offline: The machine loses its connection.

Machine Online: The machine reconnects.

Low Perfume Refill: The perfume level falls below the defined threshold.

Refill Completed: The perfume refill process is completed.

Maintenance Required: Maintenance is required.

Hardware Error: A hardware error occurs.

Payment Success: A payment is successful.

Payment Failed: A payment fails.

*User interaction:* 

Select an event group, enable or disable the corresponding Email, In-App, SMS, Push, or Webhook channels for each event, and then save the configuration.

*System response:* 

The system updates the notification delivery rules. For example, when a machine goes offline, the system sends notifications only through the enabled channels and to recipients authorized to receive them.

**4. Default Recipients**

This section displays recipient groups, such as Platform Administrator, Operations Team, Technical Team, and Finance Team.

*User interaction:* 

Click Add Recipient.

Enter an email address or select a recipient group.

Select the role or event scope for which the recipient should receive notifications.

Save the recipient list.

*System response:* 

The system validates the recipient's address and permissions. Newly added recipients receive only notifications relevant to their configured scope, preventing sensitive data from being sent to unauthorized users.

**5. Email Templates**

This section allows users to manage email subjects and message content for events such as machine offline alerts, successful payments, and maintenance notifications.

*User interaction:* 

Select an event, edit the email subject and content, preview the template, and then save it.

*System response:* 

The system validates the required data variables before allowing the template to be used. If mandatory information, such as the machine code, timestamp, or transaction ID, is missing, the interface shall display a clear error message.

**6. Test Notification**

This feature allows users to test the notification configuration before using it in production.

*User interaction:* 

Enter the recipient email address for the test.

Click Send Test.

Wait for the system to process the request and check the recipient's inbox.

*System response:* 

The interface displays the submission status and the result returned by the service. Accepted or Queued means only that the request has been accepted for processing; it does not guarantee that the email has reached the recipient's inbox.

**7. Recent Notifications**

The table below displays the notification timestamp, event, channel, recipient, subject, and delivery status.

*User interaction:* 

Click View All to open the complete notification list. If supported, filter notifications by time range, event type, channel, and status.

*System response:* 

Users can view notifications that have been sent, are pending, or have failed. For failed notifications, users can open the details to inspect the cause and retry delivery if the system supports this function.

### B.14.6. System tab

*Mockup: Figure 2.25.*

**1. Platform Information**

This section includes the platform name, version, deployment environment, language, time zone, and date and time formats.

*User interaction:* 

Navigate to Settings → System Settings.

Select the field to modify, such as Default Language.

Choose the appropriate language or time zone.

Click Save Changes.

*System response:* 

The system validates the data, saves the configuration, and displays a success or error message. Read-only fields, such as the software version, shall not be directly editable.

**2. Operational Policies**

This section includes Allow New Brand Registration, Require Admin Approval, Enable Machine Auto Sync, and Enable Maintenance Reminders.

*User interaction:* 

Toggle the switches to enable or disable the corresponding policies.

Enter the number of days before maintenance reminders are triggered, if the feature is enabled.

Adjust the background task limits, API request limit, and API timeout.

Click Save Changes to apply the settings.

*System response:* 

The system validates the values, saves the configuration, and reports the result. For example, when brand approval is enabled, new brands shall be approved before becoming active, according to the configured policy.

For Machine Auto Sync, the system shall display a separate synchronization status. Enabling this feature does not mean that all machines have received the configuration.

**3. Data Retention & Backup**

This section includes retention periods for transaction data, machine telemetry data, and system logs, as well as backup frequency, backup retention periods, and storage locations.

*User interaction:* 

Enter the retention period for each data type.

Select the Backup Frequency, such as Daily.

Configure Backup Retention.

Select an integrated storage location.

Click Save Changes to save the policies.

To perform an immediate backup, click Run Backup and confirm the action.

*System response:* 

The system reports whether the backup task has been accepted, is running, has completed, or has failed. The system shall report success only after the backend confirms the actual backup result.

**4. System Maintenance**

This feature allows administrators to restrict access during system upgrades or maintenance.

*User interaction:* 

Enable Maintenance Mode.

Review the warning about which users will be affected.

Enter or edit the Maintenance Message.

Save the message and confirm the activation of maintenance mode.

*System response:* 

The system confirms that maintenance mode has been applied. Users who are not authorized to access the system during maintenance will see the maintenance message instead of being able to use restricted functions.

A confirmation dialog should be displayed before enabling maintenance mode because this action may affect customers and operations staff.

**5. System Operations**

This section provides the following actions: Clear Cache, Restart Services, View System Health, and Run Backup.

*User interaction:* 

Clear Cache: Click the button, review the warning, and confirm cache clearing.

Restart Services: Select a supported service, review the potential impact, confirm the action, and restart the service.

View System Health: Open the detailed service health information.

Run Backup: Start a manual backup.

*System response:* 

The system displays the operation status, such as Processing, Success, or Failed. Critical operations shall enforce permission checks, be recorded in system logs, and prevent duplicate commands while a previous operation is still in progress.

**6. Service Health**

This section displays the status of the API Server, Database, MQTT Broker, and Background Worker.

*User interaction:* 

Review statuses such as Operational, Connected, or Running.

Click the refresh button to retrieve the latest data.

Click a service or View System Health to view detailed information, if this feature is available.

*System response:* 

The system updates the service status, last check time, and error information. If the status cannot be retrieved, the interface shall display Unknown or Unavailable instead of continuing to present the service as operating normally.

**7. Recent System Events**

This section displays the event timestamp, severity level, service, event description, and the user or actor responsible for the event.

*User interaction:* 

Review the latest system events.

Click View All to open the complete system log.

On the detailed log page, filter events by time range, severity level, or service if supported.

*System response:* 

Administrators can identify machine errors, notification delivery failures, transaction issues, or administrative activities and continue investigating or resolving them in the corresponding module.

### B.14.7. Security tab

*Mockup: Figure 2.26.*

**1. Password & Authentication**

This section includes the minimum password length, uppercase letters, lowercase letters, digits, special characters, password expiration, and password history.

*User interaction:* 

Administrators can change the minimum password length or enable/disable individual password rules.

Configure the password expiration period and the number of previous passwords that cannot be reused.

Configure Multi-Factor Authentication (MFA) for administrators or users.

Select an authentication method supported by the system.

Click Save Changes.

*System response:* 

The system validates the configuration and displays the result. If MFA is made mandatory, users within the applicable scope will be required to set up an authentication method according to the configured policy.

**2. Session Management**

This section includes Session Timeout, Remember Me Duration, the maximum number of concurrent sessions, and re-authentication requirements for sensitive operations.

*User interaction:* 

Enter the session expiration duration.

Select how long the system shall remember the user's login.

Set the maximum number of sessions allowed per account.

Enable re-authentication requirements before changing security settings or performing sensitive operations.

Click Save Changes.

*System response:* 

The system applies the policies to sessions according to the designed rules. When a session expires, the user is required to log in again.

**3. Account Lockout Policy**

This section includes the maximum number of failed login attempts, the account lockout duration, and email notifications when an account is locked.

*User interaction:* 

Enter the maximum number of permitted failed login attempts.

Select the account lockout duration.

Enable or disable email notifications.

Click Save Changes.

*System response:* 

When the number of failed login attempts reaches the configured threshold, the system applies the lockout policy and notifies the user or administrator according to the configuration.

Note: The system shall implement password-guessing protection and appropriate login attempt rate limits. It should not rely solely on permanent account lockouts.

**4. IP Access Control**

This section displays a table containing IP addresses or network ranges, descriptions, statuses, and available actions.

*User interaction:* 

Enable Enable IP Whitelist to restrict access to the allowlisted addresses.

Click Add IP Address.

Enter the IP address or CIDR range, description, and applicable scope.

Save the entry.

Use the edit icon to update an entry or the delete icon to remove it.

*System response:* 

The system validates the IP/CIDR format and confirms the operation. Before enabling the IP whitelist, the administrator shall ensure that their current administrative IP address is included in the allowlist to avoid locking themselves out of the system.

**5. Active Sessions**

This section displays a table containing the user, role, IP address, device/browser, login time, status, and available actions.

*User interaction:* 

Click Refresh to update the session list.

Review the device, IP address, and login time.

If a suspicious session is detected, click Terminate on the corresponding row.

Review the confirmation dialog and confirm session termination.

*System response:* 

The backend revokes the corresponding active session or token. The interface updates the status after successful confirmation. The current session may not be eligible for termination through this table.

**6. Audit & Security Monitoring**

This section includes options for logging login activities, configuration changes, and access to sensitive data.

*User interaction:* 

Enable or disable the relevant logging categories if authorized.

Click View Audit Logs to open the Audit Logs screen.

On the audit log screen, filter events by time range, user, event type, or status if supported.

*System response:* 

The system records and displays events according to the configured settings. Important security events should be logged mandatorily. Ordinary users shall not be allowed to disable or modify audit logs to conceal their actions.

**7. Recent Security Events**

This section displays a table containing the timestamp, event type, user, details, IP address, and status.

*User interaction:* 

Review the latest security events.

Click View All to view the complete history.

Open events involving failed logins, password changes, or MFA activation to inspect their details, if supported.

*System response:* 

Administrators can identify suspicious activities and proceed with the appropriate account management, session management, or access control actions.

### B.14.8. Integrations tab

*Mockup: Figure 2.27.*

**1. Integrations – Integration List**

The table displays the integration name, service type, provider, status, last check time, and available actions.

*User interaction:* 

Enter a name in Search integrations to find a service.

Select All Types to filter by Payment, Notification, IoT, or Cloud Storage.

Select All Status to filter integrations by status.

Click the pencil icon to edit an integration.

Click Add New Integration to add a new service.

*System response:* 

The list updates according to the selected filter criteria. When an integration is selected, the configuration section below displays the information for that service.

Note: Only add providers that have been defined in the system architecture or explicitly authorized by an administrator.

**2. Integration Configuration**

In the image, VNPay Payment Gateway is selected. This section contains the Configuration, Webhooks, and Test & Logs tabs.

*User interaction:* 

Edit the integration name, environment, and description.

Enter or update the Terminal ID, Merchant ID, API URL, and authentication credentials.

Click the eye icon to show or hide a secret key, if authorized.

Review the timeout duration and logging options.

Click Test Connection to verify connectivity.

If the configuration is valid, click Save Changes.

*System response:* 

The system reports whether the connection test succeeds or fails and displays the relevant error details. The configuration is saved only after the backend validates and accepts the submitted data.

Important: The Production environment shall be protected. API secrets shall not be displayed as plain text or written to logs.

**3. MQTT Broker – IoT Machine Connectivity**

For ScentStation, MQTT is a critical integration for exchanging status information and data between the backend and perfume sampling machines.

*User interaction:* 

Select MQTT Broker (IoT) from the integration list.

Configure the Broker Host, Port, Client ID, and authentication credentials.

Enable TLS if the broker supports it and a secure connection is required.

Click Test Connection.

Save the configuration after testing.

*System response:* 

The interface displays the broker connection test result. Users can then check individual machine statuses in the Machines module.

Note: A successful broker connection does not mean that every machine is online. The status of each machine shall be verified separately.

**4. Webhook & Event Delivery**

This section configures endpoints for receiving events from or sending events to integrated systems.

*User interaction:* 

Enter the Webhook Endpoint.

Enable Verify Signature to verify signatures if the integration supports this feature.

Configure the retry policy, such as the maximum number of retry attempts and the interval between attempts.

Select the event categories to receive, such as Payment Events, Machine Events, and Notification Events.

Save the configuration.

*System response:* 

The system validates the endpoint, saves the rules, and records the results of event delivery or reception. If an event fails, its status and failure reason are recorded in the integration history, provided the relevant data is available.

Endpoints shall be authenticated and protected. Arbitrary endpoints shall not be allowed to access internal services.

**5. Integration Summary**

The summary cards display the total number of integrations, the number of active integrations, and the number of inactive integrations or integrations requiring attention.

*User interaction:* 

Click the Active card to filter active integrations, if supported.

Click the Inactive card to view services that are not active.

Select the integration that requires attention from the list.

*System response:* 

The list is filtered, or the user is directed to the relevant detail section. All displayed counts shall be calculated from backend data rather than hardcoded values in the interface.

**6. Recent Integration Events**

The table displays the timestamp, integration, event, result, and message.

*User interaction:* 

Review the most recent integration events.

Click View All to view the complete history.

Look for failed events, such as Payment Callback Failed, Connection Test Failed, or Email Delivery Failed.

Open an event's details to inspect the cause, if supported.

*System response:* 

Administrators can identify which integrations have encountered errors, when the errors occurred, and what actions should be taken next. If a retry function is available, retry operations shall be controlled to prevent duplicate transaction processing or repeated notification delivery.

### B.14.9. Audit Logs tab

*Mockup: Figure 2.28.*

**1. Audit Log Filters – Log Search**

This section includes Date Range, Event Type, User, Target Module, and Severity filters.

*User interaction:* 

Select the time range to investigate.

Select an event type, such as Login Failed, Payment Callback, or Machine Offline.

Select a user or choose All Users.

Select a module, such as Authentication, Machines, Payment, or Integration.

Select a severity level: Info, Warning, or Error.

Click Search to filter the results or Reset to clear the filter criteria.

*System response:* 

The audit log table displays records that match the search criteria and the user's access permissions. If no records match, the system displays the No logs found empty state.

**2. Quick Filters**

The quick filter buttons include All, Login & Security, User Management, Brand Management, Machine Management, Transaction, Payment, System Settings, and Integration.

*User interaction:* 

Click the category to view, such as Machine Management to find events related to machines.

*System response:* 

The audit log table updates according to the selected category. Quick filters should work consistently with the advanced filter criteria above.

**3. Audit Log Table**

The table displays the timestamp, event type, user, role, module, detailed description, IP Address, and Severity.

*User interaction:* 

Click the Time column header to sort records by time, if supported.

Click a log row to view its details in the panel on the right.

Select checkboxes to mark multiple records when data export is required.

Click the three-dot icon to open additional actions available to the user.

*System response:* 

The selected row is highlighted, and the Log Details panel displays the corresponding information. Recorded audit logs should remain immutable and shall not be arbitrarily modified or deleted.

**4. Log Details**

The panel on the right displays the event type, timestamp, user, role, IP Address, User Agent, target module, and additional information.

*User interaction:* 

Select a row in the table.

Review Event Information and Details.

Check additional information, such as Session ID, authentication method, or device.

Click the copy icon next to a supported field when needed for verification.

Click View User Logs to view events associated with the user, if authorized.

Click the X icon to close the panel.

*System response:* 

The panel displays the details of the currently selected record. Sensitive information shall be masked or restricted according to the user's permissions.

**5. Export Logs**

This feature allows users to export records for reporting, internal audits, or incident investigations.

*User interaction:* 

Select the time range and filter criteria.

Click Export Logs.

Select a format, such as CSV, if supported by the system.

Confirm the data scope and export permissions.

Download the file when the system finishes processing the request.

*System response:* 

The system reports whether the export succeeds or fails. The exported file shall contain only records the user is authorized to access. Export operations should also be recorded in the Audit Logs.

**6. Pagination**

Below the table, the interface displays the total number of records, a page-size selector, and navigation controls.

*User interaction:* 

Select the number of rows per page, click a page number, or use the next and previous buttons to view other records.

*System response:* 

The table loads the corresponding page while preserving the current filter criteria. For large datasets, pagination should be handled by the backend to avoid loading all audit logs into the browser.

## B.15. Kiosk Experience

*Mockup: Figure 2.29.*

**1. Homepage and Language Selection**

Customers see the ScentStation brand, an introductory banner, and instructions for using the perfume sampling service.

*User interaction:* 

Tap VI or EN to select a language.

Read the usage instructions displayed on the right side of the screen.

Scroll through or tap a perfume category to begin exploring the products.

*System response:* 

The interface content switches to the selected language, while the product list remains unchanged.

**2. Perfume Categories and Search**

This section provides the following filters: All, Women, Men, Unisex, Niche, and Best Seller.

*User interaction:* 

Tap the desired category.

Enter a perfume name or brand in the search field.

Tap a product card to view its details, if this feature is supported.

*System response:* 

The product list updates according to the selected category or search keyword. If no results are found, the system displays an appropriate message.

**3. Product Selection**

Each perfume card displays an image, brand, product name, fragrance family or classification, and a Select button.

*User interaction:* 

Select the perfume the customer wants to experience.

The system checks whether the product is active and whether the machine is ready to provide the service.

The selected product is added to the Selected Products section.

Review the selected product and price before proceeding to payment.

*System response:* 

The number of selected products and the total amount are updated. If a product is out of stock or the machine is unavailable, the system displays a notification and prevents the customer from proceeding with that selection.

Business Rule Note: The current interface shall clearly define whether customers can select one or multiple products in a single transaction. If each transaction permits only one spray, the selection should be restricted accordingly, or explicit rules shall define how multiple product selections are handled.

**4. QR Code Payment**

The payment section displays the QR code, amount due, scanning instructions, and supported payment methods.

*User interaction:* 

Review the selected product and total amount.

Start the payment process if required by the interface.

Use a supported banking application or e-wallet to scan the QR code.

Wait for the system to verify the transaction.

*System response:* 

Pending: The system is waiting for payment confirmation.

Success: The backend has confirmed that the payment was successful.

Failed or Expired: The system displays an error or indicates that the QR code has expired, allowing the customer to retry according to the business rules.

Important: The machine shall not be activated merely because the customer scans the QR code or the interface receives a notification from the browser. The backend shall verify the transaction's validity before sending a command to control the machine.

**5. Perfume Spraying Experience**

After successful payment, the system instructs the machine to perform the authorized spray.

*User interaction:* 

Read the payment success notification.

Follow the instructions displayed on the screen or indicated by the machine's indicator lights.

Position the sample-receiving area at the designated location as instructed.

Wait for the machine to dispense one spray.

Receive a notification confirming that the experience is complete.

*System response:* 

The transaction is marked as completed when the system receives an appropriate result from the machine. If the machine encounters an error or fails to respond, the system reports the issue and initiates the transaction-handling procedure. The machine shall not automatically spray again outside the implemented duplicate-execution prevention mechanism.

**6. Completion and Return to Homepage**

After the experience, the customer sees a completion notification.

*User interaction:* 

Tap Done or Finish, if available.

The system automatically returns to the homepage after a period of inactivity.

The next customer can begin a new sampling session.

*System response:* 

The shopping cart and interface state are reset, while transaction data remains stored in the backend for reconciliation and reporting.
