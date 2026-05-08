# Grade 11 Mathematics — Topical Worksheet
## Topic 3: Integration
*Cambridge IGCSE 0606 / O-Level Add-Maths 4037 — Advanced / A* Exam Prep*

---

### 📘 Topic Concept

**Integration** reverses differentiation — also called the **antiderivative**.

**Power Rule** (for $n\neq -1$):

$$\int x^{n}\,dx=\dfrac{x^{n+1}}{n+1}+C$$

**Constant rule**: $\int k\,dx=kx+C$.
**Linearity**: $\int(af(x)+bg(x))\,dx=a\int f\,dx+b\int g\,dx$.

**Indefinite vs definite**:

$$\int_{a}^{b}f(x)\,dx=F(b)-F(a),\;\text{where }F'=f$$

The constant of integration $C$ does not appear in definite integrals.

**Area under a curve** (above the $x$-axis from $x=a$ to $x=b$):

$$\text{Area}=\int_{a}^{b}f(x)\,dx$$

If the curve is below the $x$-axis the integral is negative; take the absolute value or split the integral at the roots.

**Area between two curves** $y=f(x)$ above $y=g(x)$ on $[a,b]$:

$$\text{Area}=\int_{a}^{b}\big(f(x)-g(x)\big)\,dx$$

---

### 📝 Questions  *(Total: 41 marks)*

**Question 1** *[3]*
Find:
**(a)** $\int(6x^{2}-4x+3)\,dx$ *[1]*
**(b)** $\int x^{1/2}\,dx$ *[1]*
**(c)** $\int\dfrac{1}{x^{3}}\,dx$ *[1]*

---

**Question 2** *[3]*
$\dfrac{dy}{dx}=4x-3$ and $y=5$ when $x=2$. Find $y$ in terms of $x$.

---

**Question 3** *[4]*
Evaluate:
**(a)** $\displaystyle\int_{0}^{2}3x^{2}\,dx$ *[2]*
**(b)** $\displaystyle\int_{1}^{4}(2x+\dfrac{1}{x^{2}})\,dx$ *[2]*

---

**Question 4** *[4]*
Calculate the area enclosed by the curve $y=x^{2}$, the $x$-axis, and the lines $x=1$ and $x=3$.

---

**Question 5** *[4]*
Evaluate $\displaystyle\int_{-1}^{2}(3x^{2}-2x+1)\,dx$.

---

**Question 6** *[4]*
The curve $y=4x-x^{2}$ meets the $x$-axis at $x=0$ and $x=4$.
Calculate the area enclosed by the curve and the $x$-axis.

---

**Question 7** *[4]*
The curve $y=x^{3}$ and the line $y=4x$ intersect at $x=-2,\;0,\;2$.
**(a)** Show this is correct. *[2]*
**(b)** Calculate the total area enclosed between the curve and the line. *[2]*

---

**Question 8** *[4]*
A particle has velocity $v=3t^{2}+2t$ m/s. It starts from $s=0$ at $t=0$.
**(a)** Find the displacement function $s(t)$. *[2]*
**(b)** Find the displacement at $t=4$. *[2]*

---

**Question 9** *[4]*
Find the area of the region bounded above by $y=2x+3$ and below by $y=x^{2}$ between their points of intersection.

---

**Question 10 — Investigation** *[7]*
The curve $y=6x-x^{2}$ meets the line $y=x$ at two points $A$ and $B$.
**(a)** Find the coordinates of $A$ and $B$. *[2]*
**(b)** Show that the area of the region enclosed between the curve and the line is given by $\displaystyle\int_{0}^{5}(5x-x^{2})\,dx$. *[2]*
**(c)** Calculate the exact area of this region. *[3]*

---

### ✅ Answer Key

**Q1.**
**(a)** $\boxed{2x^{3}-2x^{2}+3x+C}$.
**(b)** $\dfrac{x^{3/2}}{3/2}+C=\boxed{\dfrac{2}{3}x^{3/2}+C}$.
**(c)** $\int x^{-3}\,dx=\dfrac{x^{-2}}{-2}+C=\boxed{-\dfrac{1}{2x^{2}}+C}$.

---

**Q2.** $y=\int(4x-3)\,dx=2x^{2}-3x+C$. At $(2,5)$: $5=8-6+C\Rightarrow C=3$.

$$\boxed{y=2x^{2}-3x+3}$$

---

**Q3.**
**(a)** $\big[x^{3}\big]_{0}^{2}=8-0=\boxed{8}$.
**(b)** $\big[x^{2}-\dfrac{1}{x}\big]_{1}^{4}=\left(16-\tfrac{1}{4}\right)-(1-1)=\boxed{15.75}=\dfrac{63}{4}$.

---

**Q4.** Area $=\displaystyle\int_{1}^{3}x^{2}\,dx=\big[\tfrac{x^{3}}{3}\big]_{1}^{3}=9-\tfrac{1}{3}=\boxed{\dfrac{26}{3}}$ ($\approx 8.67$).

---

**Q5.** $\big[x^{3}-x^{2}+x\big]_{-1}^{2}=(8-4+2)-(-1-1-1)=6-(-3)=\boxed{9}$.

---

**Q6.** Area $=\displaystyle\int_{0}^{4}(4x-x^{2})\,dx=\big[2x^{2}-\dfrac{x^{3}}{3}\big]_{0}^{4}=32-\dfrac{64}{3}=\dfrac{96-64}{3}=\boxed{\dfrac{32}{3}}$.

---

**Q7.**
**(a)** $x^{3}=4x\Rightarrow x^{3}-4x=0\Rightarrow x(x^{2}-4)=0\Rightarrow x=0,\;\pm 2$ ✓.
**(b)** By symmetry compute the area on $[0,2]$ and double:

Between $x=0$ and $x=2$, $4x\ge x^{3}$, so

$$A_{\text{half}}=\int_{0}^{2}(4x-x^{3})\,dx=\big[2x^{2}-\dfrac{x^{4}}{4}\big]_{0}^{2}=8-4=4$$

Total $=2\times 4=\boxed{8}$.

---

**Q8.**
**(a)** $s=\int(3t^{2}+2t)\,dt=t^{3}+t^{2}+C$. At $t=0$, $s=0\Rightarrow C=0$. So $\boxed{s=t^{3}+t^{2}}$.
**(b)** $s(4)=64+16=\boxed{80\,\text{m}}$.

---

**Q9.** Intersections: $2x+3=x^{2}\Rightarrow x^{2}-2x-3=0\Rightarrow(x-3)(x+1)=0\Rightarrow x=-1,\;3$.

$$A=\int_{-1}^{3}\big((2x+3)-x^{2}\big)\,dx=\big[x^{2}+3x-\dfrac{x^{3}}{3}\big]_{-1}^{3}$$

At $x=3$: $9+9-9=9$. At $x=-1$: $1-3+\tfrac{1}{3}=-\dfrac{5}{3}$.

$$A=9-\left(-\dfrac{5}{3}\right)=\dfrac{27+5}{3}=\boxed{\dfrac{32}{3}}$$

---

**Q10.**
**(a)** $6x-x^{2}=x\Rightarrow 5x-x^{2}=0\Rightarrow x(5-x)=0\Rightarrow x=0$ or $x=5$.
At $x=0$: $y=0$ → $A(0,0)$. At $x=5$: $y=5$ → $B(5,5)$. $\boxed{A(0,0),\;B(5,5)}$.

**(b)** On $[0,5]$ the curve lies above the line:

$$A=\int_{0}^{5}\big((6x-x^{2})-x\big)\,dx=\int_{0}^{5}(5x-x^{2})\,dx\;\checkmark$$

**(c)** $\big[\dfrac{5x^{2}}{2}-\dfrac{x^{3}}{3}\big]_{0}^{5}=\dfrac{125}{2}-\dfrac{125}{3}=\dfrac{375-250}{6}=\boxed{\dfrac{125}{6}}$ ($\approx 20.83$).

---

*End of Worksheet — Grade 11 / Topic 3 / Integration*
