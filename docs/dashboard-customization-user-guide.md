# Smart Manager Dashboard Customization Guide

## Purpose

Smart Manager lets each signed-in user arrange their **own workspace view**. You can choose a compact or expanded menu, prioritize your menu order, hide menu groups you do not use often, select optional top-bar controls, and tailor dashboard KPI cards and panels.

> **Important:** Dashboard customization changes your presentation only. It does not grant access to a new module, company, record, report, workflow, or action. Your role, your company membership, enabled modules, subscription, and server-side permissions remain in force.

## Open Dashboard Customization

There are two ways to open the preferences drawer after you sign in.

| Option | Steps | Best for |
|---|---|---|
| **Top-bar Customize** | Select the sliders icon labelled **Customize dashboard layout** in the top bar. On very wide screens, the button also shows the word **Customize**. | Fast adjustments while you are working. |
| **Workspace Settings** | Open **Settings**, then select **Customize dashboard** in the **Personal dashboard layout** section. | Reviewing several preferences at once. |

The **Dashboard Preferences** drawer opens from the right. Use **Manual Settings** for direct controls. The optional **AI Assistant** can suggest a currency, density, and high-level dashboard setup; review the recommendation before selecting **Apply AI Recommendation**.

## Customize the Menu

### Choose expanded or compact navigation

Under **Workspace Navigation & Command Bar**, select one of the following navigation presentations.

| Setting | What changes | Recommended use |
|---|---|---|
| **Expanded** | Shows the full desktop sidebar with labels and group details. | Users who move between several ERP modules during the day. |
| **Compact** | Uses the compact desktop rail to conserve horizontal space. | Laptop users and users who prefer more room for reports, lists, and data entry. |

The mobile menu remains a touch-friendly drawer. Compact navigation is a desktop presentation preference and does not remove the mobile menu button.

### Choose menu order

Select **Role priority** to place modules most relevant to your role first. Select **A–Z** to arrange the permitted items alphabetically within their groups.

### Show or hide permitted menu groups

In **Visible menu groups**, choose the groups you want to keep in your sidebar. Each group shows the number of workspaces currently permitted for your role.

1. Select a group to hide or show it.
2. Keep the groups you use often, such as **Sales & CRM**, **Finance**, **People**, or **Analytics**.
3. Leave less-frequent groups hidden to simplify your working view.

The **Home** group is always available and cannot be removed. If you are currently working inside an authorized group, Smart Manager keeps that group visible until you navigate away. This prevents a customization choice from leaving you without a route back to the active workspace.

## Customize the Top Bar

Use **Top-bar controls** to choose optional context controls.

| Control | What it does | Screen behavior |
|---|---|---|
| **Workspace search** | Shows the expanded workspace search and command shortcut. | Displays on wide screens where space is available. |
| **Guided tour** | Keeps the guided-tour entry in the top bar. | Available on laptop-and-larger layouts when enabled. |
| **Connection status** | Shows the Live, Demo, or offline status indicator. | Displays when the top bar has sufficient room. |
| **Current date** | Shows the business date using your selected timezone. | Displays on extra-wide layouts. |

For reliability and account safety, Smart Manager does **not** let this preference hide required account, alert, notification, security, or mobile navigation controls.

## Customize Dashboard Content

The same drawer contains dashboard content controls. Depending on your home view and permitted modules, you can tailor the presentation of KPI cards and dashboard panels.

### Set the performance range and KPI cards

1. Under **Performance Range & KPI Cards**, choose a default period: **30D**, **3M**, **6M**, or **1Y**.
2. Turn KPI cards on or off for **Revenue**, **Expenses**, **Operating result**, **Orders & sales**, and **Receivables**.
3. Smart Manager keeps at least one KPI card selected so your dashboard retains a useful summary.

### Show, hide, and reorder panels

Under **Panel Visibility & Order**, use the selection control on a panel to show or hide it. Use the up and down arrows to change its place in the dashboard.

Available panels can include **Revenue overview**, **Sales mix**, **Quick actions**, **Top products**, **Cash flow overview**, **Business health**, **Recent activity**, and **Action center**. Panels only display data that your session is already authorized to read.

### Adjust supporting display preferences

The drawer also provides personal display preferences for your dashboard currency, exchange-rate override, timezone, and table density. These help you view the workspace in a format suited to your work; they do not change company accounting records or organization-wide settings.

## Save and Reset

Changes apply as you make them and are saved to your personal preference profile for the active company. Select **Done** to close the drawer.

If you want to return to the original layout, select **Reset Defaults** at the bottom of the drawer. This restores the standard top bar, visible authorized menu groups, dashboard panels, KPI selection, and presentation settings for your user profile.

## Permission and Visibility Rules

| Situation | Result |
|---|---|
| You hide a permitted group | The group is removed only from your personal menu presentation. |
| You try to expose a group or module your role cannot use | It is not added. Smart Manager builds the menu from your authorized modules first. |
| A company subscription does not include a module | A menu preference cannot restore that module. |
| You have read-only access | Customization does not add create, edit, approve, or delete permissions. |
| You belong to a different company | Your saved layout remains separate because preferences are stored for your authenticated user and active company. |
| You are an external portal user | The portal stays restricted to the modules and actions assigned to that external role. |

> Administrators can configure company modules and membership through the appropriate administration settings. Individual dashboard customization is intentionally separate from those organization-wide controls.

## Suggested Setups

### Finance-focused workspace

Use **Expanded** navigation, choose **Role priority**, keep **Finance**, **Analytics**, and **Administration** visible where authorized, and move **Cash flow overview** and **Receivables** KPI cards higher in the dashboard.

### Compact laptop workspace

Use **Compact** navigation, hide rarely used permitted groups, leave **Workspace search** and **Guided tour** enabled, and choose a shorter performance range for quicker operational review.

### Focused operational workspace

Keep **Quick actions**, **Action center**, and **Recent activity** visible. Use role-priority ordering so the workflows you use most appear near the top of the menu.

## Troubleshooting

| Issue | What to do |
|---|---|
| A menu group is not listed | Your current role, company, module set, or subscription may not authorize it. Contact an administrator if access is expected. |
| A top-bar option is not visible after enabling it | The control may appear only at larger screen widths. Resize the browser window or use a desktop layout. |
| You cannot remove Home | This is intentional. Home is retained as a safe navigation destination. |
| You want the original view back | Open the drawer and select **Reset Defaults**. |
| An expected action is unavailable | Customization does not override read-only or workflow-specific permission checks. Ask an administrator to review your role if needed. |

## Best Practices

Keep the menu focused on the modules you use weekly, rather than hiding every group. Leave the Guided Tour available until you are comfortable with the workspace. Review your layout after a role, company membership, module, or subscription change because Smart Manager will automatically respect the new authorized scope.
