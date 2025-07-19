"use client"

import React from "react";
import BulletproofSocialFeed from "./bulletproof-social-feed";

// This is a safe wrapper that redirects to the bulletproof version
// to prevent any imports of the old broken social-feed component

export function SocialFeed() {
  // Safe wrapper that uses the bulletproof version
  return <BulletproofSocialFeed />;
}
