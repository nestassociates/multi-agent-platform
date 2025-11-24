#!/usr/bin/env python3
"""
Import all UK postcode batches to Supabase database.
This script processes 182 batch files systematically.
"""

import os
import glob
import sys

def main():
    batch_dir = "/Users/dan/Documents/Websites/Nest Associates/Project Nest/Nest/postcode_batches"
    batch_files = sorted(glob.glob(os.path.join(batch_dir, "batch_*.sql")))

    total_batches = len(batch_files)
    print(f"Total batches to process: {total_batches}")
    print("")

    # Output each batch file path for processing
    for idx, batch_file in enumerate(batch_files, 1):
        print(f"BATCH|{idx}|{total_batches}|{batch_file}")

    print("")
    print(f"Total: {total_batches} batch files ready for import")

if __name__ == "__main__":
    main()
