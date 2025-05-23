"use client";

import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { transliterate } from "@/lib/parser/address/transliteration";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// Typisierung für Felderkennung
type FieldKey =
  | "?"
  | "name"
  | "street"
  | "city"
  | "region"
  | "postal_code"
  | "phone"
  | "email"
  | "birthday";

const detectFieldType = (line: string): FieldKey => {
  const norm = line.toLowerCase();
  if (/^[\w.-]+@[\w.-]+\.[a-z]{2,}$/i.test(line)) return "email";
  if (/(?:\+7|8)?[\s-]??9\d{2}?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/.test(line)) return "phone";
  if (/^\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}$/.test(line)) return "postal_code";
  if (/^\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}$/.test(line)) return "birthday";
  if (/^[a-zA-Z\s]+/.test(line)) return "name";
  if (/^[a-zA-Z\s]+/.test(line)) return "street";
  if (/^[a-zA-Z\s]+/.test(line)) return "city";
  if (/^[a-zA-Z\s]+/.test(line)) return "region";
  return "?";
};

// The errors are throughout this file. If this is a read-only file that we're not allowed to modify,
// we need to handle it differently. For now, I'm assuming we can fix it as needed.
