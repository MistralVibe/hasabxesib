# HasabXesib

Domain language for HasabXesib, a cross-platform (iOS + Android) personal budget tracker. All code, tests, UI strings and docs use these terms.

## Language

**Account**:
A place where money lives — cash, a bank card, a bank account. Every **Transaction** and **Transfer** belongs to at least one **Account**. Has a derived **Balance**.
_Avoid_: wallet, purse, card (when meaning the account itself)

**Transaction**:
A single movement of money into (**income**) or out of (**expense**) an **Account**, tagged with a **Category**. Never a **Transfer**.
_Avoid_: entry, payment, record, movement

**Transfer**:
Moving money between two **Accounts**. It is not a **Transaction**: it never appears as income or expense in **Report**s.
_Avoid_: transaction, payment

**Category**:
A label classifying a **Transaction** (e.g. Food, Transport, Salary), with an icon and a color. Predefined set plus user-created custom categories.
_Avoid_: tag, group, type

**Budget**:
A monthly spending cap set on a **Category**. Compared against the sum of expense **Transactions** in that category for the current month.
_Avoid_: limit, plan, goal

**Recurring rule**:
A template that automatically posts a **Transaction** on each due date. Visible in a scheduled queue where it can be edited or skipped before it posts.
_Avoid_: subscription (too narrow), reminder, repeat

**Balance**:
The derived sum of an **Account**'s **Transactions** and **Transfers**. Computed, never stored.
_Avoid_: amount, total (when meaning an account's balance)

**Base currency**:
The single currency chosen at onboarding; every amount in the app is denominated in it.
_Avoid_: default currency, main currency

**Money**:
An amount stored as an integer number of minor units (e.g. cents), never a float. See ADR-0003.
_Avoid_: amount (as a float), price

**Report**:
An aggregated, read-only view of **Transactions** over a period: spending by **Category**, income vs expense per month, spending trend, top categories.
_Avoid_: statistics, analytics, insights

**Period**:
A calendar month. **Budget**s and **Report**s are monthly unless stated otherwise.
_Avoid_: month (when meaning the concept), cycle
