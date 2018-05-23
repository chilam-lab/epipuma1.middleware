occ_data = pd.read_table(
            'oc.txt',
            usecols=list(gbiftosnib.GBIF_TO_SNIBGEOPORTAL.keys()),
            dtype=gbiftosnib.GBIF_DATA_TYPES_IMPORT,
            )