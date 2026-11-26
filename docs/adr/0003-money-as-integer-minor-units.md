# Money is stored as integer minor units, never floats

Every amount in HasabXesib (transaction amounts, budget caps, account balances) is stored as an integer number of minor units of the base currency (e.g. cents: 1234 = 12.34). Floating-point arithmetic on money is a classic source of rounding bugs in finance apps, and once float amounts are persisted, migrating is painful — hence recorded. Conversion to/from decimal happens only at the UI boundary (formatting and input parsing), and the domain layer deals exclusively in minor units.
