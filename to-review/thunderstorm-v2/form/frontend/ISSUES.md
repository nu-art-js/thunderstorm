# ISSUES

Track known issues, follow-ups, and tech debt. One logical issue per section.

## Package: @nu-art/thunder-form

### Layout class `ll_v_c`

**Issue**: Form and Component_FormV3 use className `ll_v_c` (vertical layout). This is provided by app/widgets styles; document or depend on layout package if needed.

**Details**: No copy of SCSS in this package; consumers must have layout styles in scope.
