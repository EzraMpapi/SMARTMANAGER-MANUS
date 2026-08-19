# Animated logo verification

The public landing page and `/app` authentication gateway both render through the shared animated `BrandLogo` component. Desktop capture at 1280×720 confirms the supplied animation replaces the previous static mark in the header and in the large authentication brand panel. The static official-logo poster remains underneath the video for load and failure fallback. The authentication controls remain visible and unobstructed, and the existing login behavior was not changed.
The mobile capture at 390×844 keeps the animated logo visible in the public header and preserves the existing mobile authentication composition: the brand panel remains above the sign-in card, controls stay within the viewport, and no horizontal overflow was introduced.
