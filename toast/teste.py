import tkinter as tk

root = tk.Tk()
label = tk.Label(root, text="Exemplo", bg="#1e1e1e", fg="white")
label.pack(padx=30, pady=30)

print("Cor de fundo:", label.cget("bg"))  # retorna #1e1e1e

root.mainloop()
