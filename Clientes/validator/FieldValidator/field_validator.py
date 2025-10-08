import re

class fieldValidator:
    def __init__(self, value:str):
        self.value:str =  value
        self.checkCpf(self.value)
        self.checkEmail(self.value)
    class checkCpf:
        def __init__(self, value: str):
            self.value:str = value
    
        def isValid(self) -> bool:
            cpf = re.sub(r'\D', '', self.value)
            if len(cpf) != 11 or cpf == cpf[0] * 11:
                return False
            for i in range(9, 11):
                soma = sum(int(cpf[num]) * ((i+1) - num) for num in range(0, i))
                digito = ((soma * 10) % 11) % 10
                if digito != int(cpf[i]):
                    return False
            return True 
        
    class checkEmail:
        def __init__(self, value:str):
            self.value: str = value
       
        def isValid(self) -> bool:
            pattern = (
                r"^(?!.*\.\.)(?!.*\.$)[^\W][\w.\-]{0,63}@([A-Za-z0-9\-]+\.)+[A-Za-z]{2,}$"
            )
            return re.match(pattern, self.value) is not None

