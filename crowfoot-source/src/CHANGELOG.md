# Changelog

All notable changes to Crowfoot ER Designer.

## v3.1
- Normalization Lab: Check normal forms tests 1NF, 2NF, 3NF and BCNF, names the exact dependency that breaks each form, and reports the highest form reached.

## v3.0
- Production release: separate HTML, CSS and JS files, locally hosted fonts, compiled and minified CSS, offline support (installable app), security headers and a cache-friendly build. No more CDN requests.

## v2.36
- Normalization Lab: Find candidate keys lists every minimal key of R and shows prime and non-prime attributes.

## v2.35
- New Animate button: dots flow along every relationship line to show connections; press Stop to turn it off. Uses SVG, so no extra library is needed.

## v2.34
- Top bar fix: it now measures itself. Wide screens wrap onto extra rows; narrow screens collapse into a Menu drawer. Nothing goes off-screen at any width.

## v2.33
- Mobile: top bar keeps only main actions plus a Menu drawer; windows open as bottom sheets; larger touch targets; 16px inputs stop iPhone auto-zoom. Fixed duplicate button id.

## v2.32
- Animations: smooth modal/panel open, fade-in results, animated zoom and fit, glowing query highlight, flash on found table, staggered closure steps, button press feedback. Respects reduced-motion setting.

## v2.31
- New Normalize button (Normalization Lab): functional dependency input and attribute closure X+ with steps and superkey test.

## v2.30
- Aggregation: turning it off detaches relationships that pointed at it; design checks flag any that still dangle.

## v2.29
- Relational: n-ary relationships with an aggregation end also use the aggregated relationship key.

## v2.28
- Relational: a relationship on an aggregation uses the aggregated relationship's key (all participant keys) for its foreign key.

## v2.27
- Relationships to an aggregation now attach to the dashed box edge instead of a table inside it (canvas and export).

## v2.26
- Tools: relate an aggregation to a table, which creates a new diamond relationship whose end points at the aggregation.

## v2.25
- PNG/SVG export now includes aggregation boxes.

## v2.24
- Tools: Aggregation toggle draws a dashed box around a diamond relationship and its participants (saved with the diagram).

## v2.23
- Mode button now remembers your choice after reloading the page.

## v2.22
- PNG/SVG export now follows the Mode button (Conceptual hides types and flags, Logical hides types).

## v2.21
- New Mode button cycles Physical / Logical / Conceptual views of the table cards (hides types and flags progressively).

## v2.20
- Relational: every mapped table now shows the rule applied (entity, multivalued, weak, M:N, n-ary).

## v2.19
- Relational: Download .txt exports the relational schema (keys marked with *) for assignments and reports.

## v2.18
- Relational: "Create junction tables" button converts every many-to-many line into a junction table in one click.

## v2.17
- Relational: "Create multivalued tables" button adds the generated tables and FK relationships to the diagram (undoable with Ctrl+Z).

## v2.16
- Relational: ISA specialization shown with 3 mapping strategies (table per entity, single table, subtypes only) and when each applies.

## v2.15
- Relational: n-ary relationships (3+ participants) map to one table with every participant key; "one" sides stay out of the key.

## v2.14
- Relational: M:N relationships (drawn lines and diamond relationships) become junction tables with both keys and relationship attributes.

## v2.13
- Relational: each relationship is classified (1:1, 1:N, N:1, M:N) with a check that the foreign key is on the correct side and 1:1 keys are UNIQUE.

## v2.12
- Relational: weak entities map to tables keyed by the owner key plus partial key, with FK to the owner.

## v2.11
- Relational: multivalued attributes now map to their own tables (owner key + value, with FK back to the owner).

## v2.10
- New Relational button: ER → Relational step 1 (entities to tables, composite attributes split, derived dropped; weak and multivalued deferred).

## v2.9
- SQL import: reads column-level CHECK (...) constraints into the CHECK field, so export and import round-trip.

## v2.8
- Columns: CHECK expression field (in the column editor), saved with the diagram and exported in MySQL CREATE TABLE.

## v2.7
- Tools: Inheritance (ISA) preview showing each subtype's inherited and own columns, plus disjoint/overlapping and total/partial.

## v2.6
- Tools: Relationship degree table (unary / binary / ternary / n-ary) listing participants for every relationship.

## v2.5
- Design checks: role/label check for recursive relationships and repeated relationships between the same two tables.

## v2.4
- Design checks: weak-entity validation (partial key, identifying relationship, total participation, owner key in key).

## v2.3
- Tools: Keys table listing each primary key and other candidate keys (UNIQUE + NOT NULL), and flagging UNIQUE-but-nullable columns.

## v2.2
- Relationship editor: Total / Partial participation toggle for each end (switches min cardinality 1 / 0).

## v2.1
- Added "What's new" changelog (this window).
- Design checks: duplicate relationship and direct many-to-many warnings.

## v2.0
- Touch: pinch-zoom, two-finger pan, on-screen zoom buttons.
- Tools: find table, design checks, data dictionary (.md).
- Query visualizer: highlights tables/joins used by a SELECT.

