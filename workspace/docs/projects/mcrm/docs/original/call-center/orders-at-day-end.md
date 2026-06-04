# Orders at Day End — What Happens to Unconfirmed / Unprocessed?

> When the day ends, orders still `new`, `scheduled`, or `confirmed` (waiting leader) remain in the system. Here's what actually happens — and what does *not*.

---

## Short Answer

**Nothing automatic happens at day end.** Orders persist. They are not deleted, auto-escalated, or auto-canceled. No cron runs. Agents see them the next day — but *which* day chip they pick matters.

---

## What Exists vs What the Queue Shows


| Order State                  | Still in DB? | Where It Shows                         |
| ---------------------------- | ------------ | -------------------------------------- |
| `new`                        | Yes          | In "day created" — pick that date chip |
| `scheduled`                  | Yes          | Same — pick date chip of `created_at`  |
| `confirmed` (waiting leader) | Yes          | In confirmed tab, same date logic      |
| `canceled`                   | Yes          | In canceled tab                        |
| `converted`                  | Yes          | In completed tab                       |


---

## The Date Filter — Day Chip Logic

The QueueStatusBar has 7 day chips (today + 6 future days). When `today` is passed (YYYY-MM-DD):

- **"Today" chip** = backlog (past open) ∪ orders created today
- **Future chips** = orders with `scheduled_callback_at` in that day

Without `today` param: legacy behavior (filter by `created_at` only).

---

## What Does *Not* Happen (No Automation)


| Scenario                                      | Implemented? | Notes                                      |
| --------------------------------------------- | ------------ | ------------------------------------------ |
| Day-end auto-escalation                       | No           | Would need cron                            |
| Day-end auto-cancel                           | No           | Would need cron                            |
| `scheduled` → `new` when callback time passes | **No**       | Doc says "cron/queue" — **no cron exists** |
| Roll old orders into "today"                  | **Yes**      | When `today` param passed; backlog + today |
| Cleanup of stale drafts                       | No           | Manual cancel only                         |


---

## `scheduled` Orders — The Gap

Doc says: *"scheduled → new (re-enters queue when callback time arrives)"*.

**Current behavior:** No job runs to change `scheduled` → `new`. The order stays `scheduled` until:

- An agent manually works it
- Or you add a scheduled job that sets `status = 'new'` when `scheduled_callback_at <= NOW()`

---

## `no_answer` × 3 — Status Unchanged

When the agent logs the 3rd (or more) no_answer, status stays unchanged. The order remains in its current tab (new/scheduled/confirmed) until the agent acts (confirm/schedule/cancel/no-answer). Event-driven (API call), not time-driven.

---

## Recommendations (If You Want Day-End Behavior)

1. **Add a cron job** that:
  - Sets `scheduled` → `new` when `scheduled_callback_at <= NOW()`
  - Optionally: flags orders for review if still `new` after N days
2. **Extend the date filter** so agents can see past days (e.g. "yesterday", "2 days ago") for backlog.
3. **Add an "overdue" view** — orders with `scheduled_callback_at < NOW()` and `status = 'scheduled'`.

---

## Summary


| Question                                                 | Answer                                             |
| -------------------------------------------------------- | -------------------------------------------------- |
| Do unconfirmed orders disappear?                         | No — they stay in DB                               |
| Do they auto-escalate or auto-cancel?                    | No                                                 |
| Do scheduled orders re-enter the queue at callback time? | No — no cron                                       |
| How do I see yesterday’s unprocessed orders?             | Under "today" chip (backlog rolls in)          |
| What does happen at day end?                             | Nothing. Next day, agents work from the same data. |


