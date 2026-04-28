import os

path = r'c:\Users\DELL\OneDrive\Desktop\AI Medical Record\ClinIQ\frontend\src\pages\dashboards\Patient.jsx'

with open(path, 'rb') as f:
    content = f.read()

print("File size before:", len(content))

replacements = [
    # follow-up icon: corrupted -> 📋 (clipboard)
    (b"\xf0\x9f\x93\x9d\xe2\x80\x9d\xe2\x80\x9e", b"\xf0\x9f\x93\x8b"),
    # specialist icon: corrupted -> 🔬 (microscope)
    (b"\xf0\x9f\x93\x9d\xe2\x80\x9d\xc2\xac", b"\xf0\x9f\x94\xac"),
    # clock before Available Time Slots: corrupted -> ⏰
    (b"\xc3\xa2\xc2\x8f\xc2\xb0 Available Time Slots", b"\xe2\x8f\xb0 Available Time Slots"),
    # before Reason for Visit: corrupted -> 📝
    (b"\xf0\x9f\x93\x9d\xe2\x80\x9c\xc2\x9d Reason for Visit", b"\xf0\x9f\x93\x9d Reason for Visit"),
    # before Upload Medical Records: corrupted -> 📎
    (b"\xf0\x9f\x93\x9d\xe2\x80\x9c\xc5\xbd Upload Med", b"\xf0\x9f\x93\x8e Upload Med"),
    # error icon in handleRecordUpload
    (b"\xc3\xa2\xc5\x92\x8c ", b"\xe2\x9d\x8c "),
    # box drawing chars in comments (â"€)
    (b"\xc3\xa2\xe2\x80\x9c\xe2\x80\x94", b"\xe2\x94\x80"),
]

for old, new in replacements:
    count = content.count(old)
    if count:
        content = content.replace(old, new)
        print(f"Fixed {count}x: {repr(old[:20])} -> {repr(new[:20])}")
    else:
        print(f"Not found: {repr(old[:20])}")

with open(path, 'wb') as f:
    f.write(content)

print("File size after:", len(content))
print("Done.")
